# 🚀 Karnal Reality - 24/7 Cloud Autopilot & Multi-Device CRM (Render.com)

A complete, self-contained, zero-cost real estate client outreach engine with:
* **Zero Supabase Dependency**: 100% self-hosted local CRM database (`database/karnal_leads_db.json`).
* **Multi-Device WhatsApp Engine**: Supports **up to 9 distinct SIM slots** (`Device #1` to `Device #9`).
* **24-Hour Adaptive Human Cadence**: Strictly **50 leads per device per 24 hours ("no more, no less")** with natural business hours pacing (09:30 AM – 08:30 PM IST) and night sleep protection.
* **Non-WhatsApp Phone Pre-Filtering**: Unregistered mobile numbers are flagged as `NOT_ON_WHATSAPP` and skipped without counting towards daily quota.
* **Human Presence Simulation**: `sendSeen()` glance receipt, natural typing indicator (3.5–6.8s), and Spintax cryptographic reference IDs (`Ref: KR-XXXX`).
* **24/7 Free Programmatic Scraper**: Coded in Node.js (zero Chrome extensions, $0 APIs) continuously scanning 99acres, MagicBricks, Housing, OLX, YouTube, and Facebook.
* **1-Click Downloadable Sheet**: Instant export to CSV/Excel on the dashboard.
* **Zero Downtime on Render**: Built-in 10-minute self-ping loop keeps Render's container awake 24/7.

---

## 📂 Exact Folder Path for GitHub Upload

The completed, fully self-contained package is located at:
```
F:\Projects\karnal-property-leads\render_whatsapp_cloud
```

### Files Ready for Upload:
```
render_whatsapp_cloud/
├── database/
│   ├── karnal_leads_db.json      (Verified CRM leads)
│   └── device_stats.json         (Persistent quota counters)
├── public/
│   └── dashboard.html            (Executive Luxury Dark CRM Dashboard)
├── .dockerignore                 (Excludes unnecessary files from Docker build)
├── .gitignore                    (Excludes node_modules, session_auth, temp logs)
├── ai_responder.js               (Groq Qwen-3.8-27b + Gemini fallback + co-brokering partner AI)
├── device_manager.js             (9-Slot WhatsApp Web manager with human typing & non-WA detection)
├── Dockerfile                    (Pre-configured with headless Chromium & Node.js 18)
├── free_scraper.js               (High-speed programmatic 24/7 multi-platform scraper)
├── package.json                  (Dependencies: express, qrcode, whatsapp-web.js)
├── README.md                     (Full documentation & architecture)
├── render.yaml                   (Render blueprint deployment specification)
└── server.js                     (Express REST API, 24h adaptive pacer & keep-alive ping)
```

---

## 🛠️ Step-by-Step GitHub & Render.com 24/7 Deployment

### Step 1: Push to GitHub
1. Open PowerShell / Command Prompt.
2. Navigate to this directory:
   ```powershell
   cd F:\Projects\karnal-property-leads\render_whatsapp_cloud
   ```
3. Initialize Git and push:
   ```bash
   git init
   git add .
   git commit -m "Deploy 24/7 Multi-Device WhatsApp CRM"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/karnal-reality-autopilot.git
   git push -u origin main
   ```
   *(Or drag & drop all files directly into the GitHub web interface at github.com!)*

---

### Step 2: Deploy to Render.com (1-Click Docker)
1. Go to **[dashboard.render.com](https://dashboard.render.com)**.
2. Click **New +** > **Web Service**.
3. Select your GitHub repository: `karnal-reality-autopilot`.
4. Render will automatically detect the `Dockerfile` and configure:
   * **Runtime**: `Docker`
   * **Region**: `Singapore` (or closest to India)
   * **Instance Type**: `Free`
5. Click **Deploy Web Service**!

Render will build the Docker container with headless Chromium, set up persistent ports, and launch the service in ~2 minutes.

---

### Step 3: Access Your 24/7 Live Cloud Dashboard
Render will assign a public URL like:
`https://karnal-reality-autopilot.onrender.com`

When you open this URL:
1. You will see the **Executive CRM Dashboard** with all harvested leads.
2. Under **Multi-Device Engine**, click **"⚡ Connect Device"** on Slot #1 (or slots 2 to 9).
3. Scan the live QR code with your phone (**WhatsApp > Linked Devices > Link a Device**).
4. Once connected, that device turns **🟢 ONLINE** and safely delivers up to 50 leads per 24 hours.
5. Click **"⚡ Pre-Verify Numbers"** anytime to filter out non-WhatsApp numbers in bulk with zero quota waste.
6. Click **"📥 Download Leads (CSV)"** anytime to download the verified spreadsheet.
