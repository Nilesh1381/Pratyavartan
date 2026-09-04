# 🤗 Hugging Face Spaces Deployment Guide — Backend (Gradio SDK / Card-Free)

This guide walks you through deploying the **Pratyavartan** FastAPI backend engine to **Hugging Face Spaces** using the **Gradio SDK** on port `7860`. 

> [!NOTE]
> **Why Gradio SDK?**
> Hugging Face has a zero-limit quota on Docker SDK for newly created accounts. By selecting the **Gradio SDK**, Hugging Face automatically provisions Python 3.11 with 2 vCPU and 16 GB RAM completely free without requiring a credit card, and executes `app.py` directly on port `7860` to serve our FastAPI application.

---

## 📦 What to Upload: The `hf-gradio/` Bundle

A standalone, pre-tested bundle is ready at:
[`hf-gradio/`](file:///c:/Users/niles/OneDrive/Documents/opencode/hf-gradio)

**Contents:**
- `README.md` (Contains exact Gradio YAML front matter: `sdk: gradio`, `python_version: "3.11"`, `emoji: 🛡️`)
- `app.py` (Entrypoint serving FastAPI via `uvicorn.run(app, host="0.0.0.0", port=7860, workers=1)`)
- `requirements.txt` (`fastapi`, `uvicorn[standard]`, `openai`, `razorpay`, `pydantic`, `python-dotenv`, `jinja2`, `httpx`, `gTTS`)
- `main.py`, `db.py`, `orchestrator.py`, `ai_agent.py`, `razorpay_service.py`
- `check_ai.py`, `check_audit.py`
- `templates/index.html`

*(Notice: `revive-site/`, `.env`, `*.db*`, `audio/*.mp3`, `Dockerfile`, and `.git/` are strictly excluded).*

---

## 🚀 Step-by-Step Deployment Instructions

### Step 1: Configure Space SDK on Hugging Face
If you already created the Space **`Nilesh67/Pratyavartan`**:
1. Open your Space at: [huggingface.co/spaces/Nilesh67/Pratyavartan](https://huggingface.co/spaces/Nilesh67/Pratyavartan)
2. Go to **Settings** → **Space SDK**.
3. Ensure the Space SDK is set to **Gradio** (or update the `README.md` frontmatter which automatically configures it).
4. If you wish to keep your backend code private:
   - Go to **Settings** → **Space visibility** → Switch to **Private** (Free on Hugging Face).

---

### Step 2: Configure Secrets in Space Settings (MANDATORY BEFORE UPLOADING)

1. In your Space, open the **Settings** tab.
2. Scroll down to **Variables and secrets**.
3. Click **New secret** for each of the following (copy exact values from your local `.env`):

| Secret Name | Type | Value / Source | Description |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | **Secret** | `rzp_test_...` (from `.env`) | Razorpay API authentication ID |
| `RAZORPAY_KEY_SECRET` | **Secret** | `...` (from `.env`) | Razorpay API Secret |
| `LLM_API_KEY` | **Secret** | `sk-or-v1-...` (from `.env`) | LLM model key (OpenRouter / MiniMax) |
| `RAZORPAY_WEBHOOK_SECRET` | **Secret** | `...` (from `.env`) | HMAC SHA-256 webhook signature secret |
| `DEMO_VPA` | **Secret** | `revive@upi` | Default UPI VPA for recovery intent links |

4. In the same section, under **Variables** (or Secrets), add:

| Variable Name | Type | Value | Description |
|---|---|---|---|
| `ALLOWED_ORIGINS` | **Variable** / **Secret** | `https://pratyavartan.vercel.app` | Allows CORS requests from your Vercel landing page |
| `LLM_BASE_URL` | **Variable** | `https://openrouter.ai/api/v1` | LLM Gateway base URL |
| `LLM_MODEL` | **Variable** | `minimax/minimax-01` | LLM model name |

---

### Step 3: Upload Files from `hf-gradio/`

Choose either Method A (Web UI) or Method B (Git CLI):

#### Method A: Direct Web UI Upload (Simplest — 1 Minute)
1. In your Space, click the **Files** tab.
2. If there are old files from previous attempts, you can delete them or overwrite them.
3. Click **Add file** → **Upload files**.
4. Drag and drop all files and folders directly from your local [`hf-gradio/`](file:///c:/Users/niles/OneDrive/Documents/opencode/hf-gradio) folder:
   - `README.md`
   - `app.py`
   - `requirements.txt`
   - `main.py`
   - `db.py`
   - `orchestrator.py`
   - `ai_agent.py`
   - `razorpay_service.py`
   - `check_ai.py`
   - `check_audit.py`
   - `templates/index.html` (inside a `templates` directory)
5. Enter commit message: `feat: deploy gradio fastapi backend`
6. Click **Commit changes to main**.

#### Method B: Git Push to Hugging Face
Run in PowerShell:
```powershell
cd c:\Users\niles\OneDrive\Documents\opencode\hf-gradio
git init -b main
git remote add space https://huggingface.co/spaces/Nilesh67/Pratyavartan
git add .
git commit -m "feat: deploy gradio fastapi backend"
git push -u space main --force
```
*(When prompted for password/token, provide your Hugging Face User Access Token with **Write** permissions from [hf.co/settings/tokens](https://huggingface.co/settings/tokens)).*

---

### Step 4: Verify Deployment & Direct URLs

1. Click the **App** tab on your Space.
2. Hugging Face will install dependencies from `requirements.txt` and launch `app.py`.
3. Once the status badge switches to **Running**, test the direct URLs:

- **Expected Backend URL**:
  `https://nilesh67-pratyavartan.hf.space`

- **Health Check Endpoint**:
  ```bash
  curl https://nilesh67-pratyavartan.hf.space/health
  # Response: {"status":"healthy","phase":"complete",...}
  ```

- **Interactive Merchant Console / Dashboard**:
  `https://nilesh67-pratyavartan.hf.space/dashboard`

- **Interactive OpenAPI Documentation**:
  `https://nilesh67-pratyavartan.hf.space/docs`

---

### Step 5: Connect Vercel Landing & Razorpay Webhooks

1. **Vercel Frontend Configuration**:
   - In your Vercel project settings (`https://vercel.com`), go to **Settings** → **Environment Variables**.
   - Add or update:
     - `NEXT_PUBLIC_CONSOLE_URL` = `https://nilesh67-pratyavartan.hf.space`
   - Trigger a redeployment of your Vercel project to pick up the backend URL.

2. **Razorpay Webhook Configuration**:
   - Open your [Razorpay Dashboard](https://dashboard.razorpay.com/) → **Settings** → **Webhooks**.
   - Add or update your Webhook URL to:
     ```text
     https://nilesh67-pratyavartan.hf.space/razorpay-webhook
     ```
   - **Secret**: Enter the exact secret you configured in `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events**: Check `payment.link.paid`, `payment.failed`, `order.paid`.
