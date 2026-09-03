# 🌐 Vercel Deployment Guide — Landing Site (Card-Free)

This guide walks you through deploying the **Pratyavartan** Next.js landing site to **Vercel** for free (no credit card required).

---

## 📋 Prerequisites

1. Your GitHub repository (`Nilesh1381/Pratyavartan`) is pushed and up-to-date.
2. Your Hugging Face Space backend is created (or you have the intended backend URL).
   - If not created yet, see [DEPLOY_HF.md](DEPLOY_HF.md).

---

## 🚀 Step-by-Step Deployment

### 1. Import Repository into Vercel
1. Go to [vercel.com](https://vercel.com) and log in with GitHub (free hobby tier, no card needed).
2. On your dashboard, click **Add New...** → **Project**.
3. Locate **`Nilesh1381/Pratyavartan`** in the list and click **Import**.

---

### 2. Configure Root Directory
> ⚠️ **CRITICAL STEP:** The landing site lives in the `revive-site` subdirectory.
1. In the **Configure Project** section, locate **Root Directory**.
2. Click **Edit**.
3. Select or type: **`revive-site`**
4. Click **Continue**.
5. Framework Preset will automatically detect **Next.js**.

---

### 3. Configure Environment Variables (BEFORE Build)
Next.js bakes `NEXT_PUBLIC_*` variables into client-side JavaScript bundles **at build time**. Set these before clicking Deploy:

Expand the **Environment Variables** section and add:

| Variable Name | Value | Description |
|---|---|---|
| `NEXT_PUBLIC_CONSOLE_URL` | `https://<user>-<space-name>.hf.space` | Direct URL to HF Space root (redirects to `/dashboard`) |
| `NEXT_PUBLIC_API_DOCS_URL` | `https://<user>-<space-name>.hf.space/docs` | Interactive Swagger API docs |
| `NEXT_PUBLIC_API_BASE_URL` | `https://<user>-<space-name>.hf.space/api` | API routes |

> 💡 **Hugging Face Direct URL Format:**
> For a Space named `revive-backend` under user `nilesh1381`, the direct app URL is:
> `https://nilesh1381-revive-backend.hf.space`
> *(You can find this in HF Space: click the 3 dots `...` in upper right → "Embed this space" or look at the iframe source)*

---

### 4. Deploy
1. Click **Deploy**.
2. Vercel will run `npm install`, compile Next.js with Turbopack, and deploy your site to their edge network (~60 seconds).
3. Once deployed, you will get a production URL:
   ```text
   https://pratyavartan.vercel.app  (or https://<your-project-name>.vercel.app)
   ```

---

### 5. Post-Deploy: Link with Backend CORS
1. Copy your Vercel URL (e.g., `https://pratyavartan.vercel.app`).
2. Go to your **Hugging Face Space** → **Settings** → **Variables and secrets**.
3. Set or update the Secret:
   - Name: `ALLOWED_ORIGINS`
   - Value: `https://pratyavartan.vercel.app`
4. This ensures browser requests from your Vercel landing page to the HF backend are approved by CORS.
