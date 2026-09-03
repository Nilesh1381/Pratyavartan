# 🤗 Hugging Face Spaces Deployment Guide — Backend (Card-Free)

This guide walks you through deploying the **Pratyavartan** FastAPI backend engine to **Hugging Face Spaces** using the **Docker SDK** (100% card-free, 2 vCPU, 16 GB RAM free forever).

---

## ⚠️ Security & Visibility Notice (Please Read)

> [!IMPORTANT]
> **Hugging Face Space Visibility:**
> - By default, newly created Spaces are **Public**, meaning anyone browsing Hugging Face can see the files uploaded to the Space repository (`main.py`, `Dockerfile`, etc.).
> - **Your API secrets (`RAZORPAY_KEY_SECRET`, `LLM_API_KEY`, etc.) remain 100% HIDDEN AND ENCRYPTED** as long as you add them under **Settings → Variables and secrets → New secret** (NOT as public variables).
> - **Privacy Option:** Hugging Face **allows Free Spaces to be set to Private**! If you do not want your backend source code visible publicly, go to **Space Settings → Space visibility → Switch to Private**.

---

## 📦 What to Upload: The `hf-space/` Bundle

A standalone, deploy-ready bundle has been created at:
[`hf-space/`](file:///c:/Users/niles/OneDrive/Documents/opencode/hf-space)

Contents:
- `README.md` (includes YAML header configuring `sdk: docker` and `app_port: 8010`)
- `Dockerfile` (reused root Dockerfile binding `0.0.0.0` with `${PORT:-8010}`)
- `requirements.txt`
- `main.py`, `db.py`, `orchestrator.py`, `ai_agent.py`, `razorpay_service.py`
- `check_ai.py`, `check_audit.py`
- `templates/index.html`
- `.dockerignore`

*(Notice: `revive-site/`, `.env`, `*.db*`, `audio/*.mp3`, and `.git/` are strictly excluded).*

---

## 🚀 Step-by-Step Deployment

### 1. Create a New Space on Hugging Face
1. Go to [huggingface.co/new-space](https://huggingface.co/new-space) (sign up / log in — no credit card needed).
2. Configure:
   - **Space name**: `revive-backend` (or `pratyavartan-backend`)
   - **License**: MIT (or your preference)
   - **Space SDK**: **Docker** (Select **Blank**)
   - **Space hardware**: **CPU basic • 2 vCPU • 16 GB RAM • Free**
   - **Visibility**: **Public** (or **Private** for code privacy)
3. Click **Create Space**.

---

### 2. Configure Secrets in Space Settings (BEFORE uploading code)
1. Go to your newly created Space → **Settings** tab.
2. Scroll to the **Variables and secrets** section.
3. Click **New secret** for each of the following (copy values from your local `.env`):

| Secret Name | Value / Source | Purpose |
|---|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_...` (from `.env`) | Razorpay API authentication |
| `RAZORPAY_KEY_SECRET` | `...` (from `.env`) | Razorpay secret key |
| `LLM_API_KEY` | `sk-or-v1-...` (from `.env`) | LLM model access (OpenRouter/MiniMax) |
| `RAZORPAY_WEBHOOK_SECRET` | `...` (from `.env`) | HMAC SHA-256 webhook signature verification |
| `DEMO_VPA` | `revive@upi` | Fallback UPI VPA for recovery intent links |
| `ALLOWED_ORIGINS` | Leave empty for now | Will be set to your Vercel landing URL in Step 5 |

*(Optional Variables under "New variable"):*
- `LLM_BASE_URL` = `https://openrouter.ai/api/v1`
- `LLM_MODEL` = `minimax/minimax-01`
- `PROMISE_GRACE_MINUTES` = `30`

---

### 3. Upload the `hf-space/` Files to Your Space

You can choose either of two simple methods:

#### Method A: Direct Web UI Upload (Simplest — 1 Minute)
1. In your Space, click the **Files** tab.
2. Click **Add file** → **Upload files**.
3. Drag and drop all files and the `templates/` folder from [`hf-space/`](file:///c:/Users/niles/OneDrive/Documents/opencode/hf-space).
4. Type commit message: `Initial backend deployment`.
5. Click **Commit changes to main**.

#### Method B: Git Push to Hugging Face
Run in PowerShell:
```powershell
cd c:\Users\niles\OneDrive\Documents\opencode\hf-space
git init -b main
git remote add space https://huggingface.co/spaces/<YOUR_HF_USERNAME>/<YOUR_SPACE_NAME>
git add .
git commit -m "Initial backend deployment"
git push -u space main --force
```
*(When prompted for password, use your Hugging Face Access Token with Write permissions from [hf.co/settings/tokens](https://huggingface.co/settings/tokens)).*

---

### 4. Build & Verify Space
1. Click the **App** tab on your Space.
2. Hugging Face will automatically run `docker build` using the Dockerfile and start the container on port 8010.
3. Once the status shows **Running**:
   - The embedded UI will display the **Merchant War Room & Audit Trail Dashboard**.

---

### 5. Find Your Direct Space URL & Connect with Vercel
Hugging Face embeds the app in an iframe on the Space page. For API calls, webhooks, and Vercel connection, you need the **Direct URL**.

- **URL Pattern**:
  ```text
  https://<YOUR_HF_USERNAME>-<YOUR_SPACE_NAME>.hf.space
  ```
  *(Example: if username is `nilesh1381` and space is `revive-backend`:)*
  `https://nilesh1381-revive-backend.hf.space`

- **Verification endpoints**:
  - Health: `https://<user>-<space>.hf.space/health` (returns `{"status":"healthy"}`)
  - Dashboard: `https://<user>-<space>.hf.space/dashboard`
  - Docs: `https://<user>-<space>.hf.space/docs`

---

### 6. Link Vercel & Razorpay
1. **In Vercel**:
   Set `NEXT_PUBLIC_CONSOLE_URL = https://<user>-<space>.hf.space`
2. **In HF Space Secrets**:
   Set `ALLOWED_ORIGINS = https://<your-vercel-domain>.vercel.app`
3. **In Razorpay Dashboard**:
   Add Webhook URL: `https://<user>-<space>.hf.space/razorpay-webhook` with active events `payment.link.paid` and `payment.failed`.
