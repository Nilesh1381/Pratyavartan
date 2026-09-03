"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Animated gradient mesh — the page's living background.
 * Charcoal base; teal/copper blobs drift (Three.js shader plane), and a scroll
 * driven arc blends cool (failure) → copper neutral (understanding) → amber
 * warm (recovery). Amber only ever appears near the end of the story.
 */
export default function GradientMesh() {
  const host = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uWarm: { value: 0 },   // 0 = cool arc, 1 = warm arc
      uAmber: { value: 0 },  // celebration gate
      uRes: { value: new THREE.Vector2(el.clientWidth, el.clientHeight) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        precision mediump float;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uWarm;
        uniform float uAmber;
        uniform vec2 uRes;

        float blob(vec2 p, vec2 c, float r) {
          float d = distance(p, c);
          return smoothstep(r, 0.0, d);
        }

        void main() {
          vec2 p = vUv;
          p.x *= uRes.x / uRes.y;

          // drifting blob centers (slow, meditative)
          vec2 c1 = vec2(0.75 + 0.10*sin(uTime*0.11), 0.72 + 0.08*cos(uTime*0.09));
          vec2 c2 = vec2(0.22 + 0.12*cos(uTime*0.07), 0.30 + 0.10*sin(uTime*0.13));
          vec2 c3 = vec2(0.55 + 0.15*sin(uTime*0.05+2.0), 0.45 + 0.14*cos(uTime*0.06+1.0));

          vec3 charcoal = vec3(0.102, 0.102, 0.102);   // #1a1a1a
          vec3 teal     = vec3(0.125, 0.698, 0.667);   // #20b2aa
          vec3 copper   = vec3(0.804, 0.498, 0.196);   // #cd7f32
          vec3 amber    = vec3(1.0, 0.588, 0.0);       // #ff9500

          float b1 = blob(p, c1, 0.85);
          float b2 = blob(p, c2, 0.80);
          float b3 = blob(p, c3, 0.70);

          // COOL phase: teal dominant, faint copper
          vec3 cool = charcoal
            + teal * b1 * 0.10
            + copper * b2 * 0.05;

          // NEUTRAL phase: copper rises
          vec3 neutral = charcoal
            + copper * max(b2, b3) * 0.13
            + teal * b1 * 0.05;

          // WARM phase: copper strong + amber gate
          vec3 warm = charcoal
            + copper * max(b2, b3) * 0.16
            + amber * b3 * (0.10 + 0.08*uAmber)
            + teal * b1 * 0.03;

          float m1 = smoothstep(0.30, 0.62, uWarm);   // cool → neutral
          float m2 = smoothstep(0.62, 0.88, uWarm);   // neutral → warm
          vec3 col = mix(mix(cool, neutral, m1), warm, m2);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let raf = 0;
    let running = true;
    const startTime = performance.now();

    const tick = () => {
      if (!running) return;
      uniforms.uTime.value = (performance.now() - startTime) * 0.001;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };

    const doc = document.documentElement;
    const onScroll = () => {
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      uniforms.uWarm.value = Math.min(1, window.scrollY / max);
      // Amber gates open only in the final act of the story
      const recovery = document.getElementById("recovery");
      if (recovery) {
        const r = recovery.getBoundingClientRect();
        const visible = Math.max(0, 1 - Math.abs(r.top) / window.innerHeight);
        uniforms.uAmber.value = Math.max(uniforms.uWarm.value > 0.8 ? 1 : 0, visible);
      } else {
        uniforms.uAmber.value = uniforms.uWarm.value > 0.8 ? 1 : 0;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const ro = new ResizeObserver(() => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      uniforms.uRes.value.set(el.clientWidth, el.clientHeight);
    });
    ro.observe(el);

    if (reduced) {
      uniforms.uTime.value = 4;
      renderer.render(scene, camera);
    } else {
      // pause offscreen via IO on the fixed host (always visible → effectively always on,
      // but keep the guard for tab-hidden rAF throttling anyway)
      raf = requestAnimationFrame(tick);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      material.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [reduced]);

  return (
    <div
      ref={host}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
