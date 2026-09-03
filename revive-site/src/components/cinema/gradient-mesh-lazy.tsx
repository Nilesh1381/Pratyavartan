"use client";

import dynamic from "next/dynamic";

const GradientMesh = dynamic(() => import("@/components/gradient-mesh"), { ssr: false });

export default function GradientMeshLazy() {
  return <GradientMesh />;
}
