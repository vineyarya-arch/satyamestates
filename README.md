# 🏢 Karnal Reality - 24/7 Cloud Multi-Device WhatsApp CRM & Lead Engine

An enterprise-grade, self-contained, 24/7 real estate client harvesting and outreach engine deployed on **Render.com** via GitHub with **$0 database costs (Zero Supabase Dependency)**.

---

## 🌟 Key Highlights & Architecture

1. **Multi-Device Engine (Up to 9 WhatsApp SIMs)**:
   - Connect up to 9 physical WhatsApp numbers concurrently (`Device #1` to `Device #9`).
   - Round-robin load balancing distributes outreach across all online devices.
   - Aggregate capacity: **up to 450 verified lead deliveries per day** (50 x 9 SIMs).

2. **24-Hour Adaptive Human-Undetectable Cadence**:
   - **Strict Daily Target**: Exactly **50 messages per SIM per 24 hours ("no more, no less")**.
   - **Business Hours Pacing (09:30 AM to 08:30 PM IST)**: Cold outreach automatically runs during natural business hours.
   - **Night Silence Mode**: Pauses automatically between 08:30 PM and 09:30 AM IST to respect clients' sleep and eliminate spam complaints.
   - **Human Pacing Jitter**: Messages spaced 8 to 15 minutes apart with Gaussian micro-variations.
   - **Micro-Batch Mode**: 2-3 messages followed by a realistic 15–20 minute tea/call break.

3. **Non-WhatsApp Phone Pre-Filtering & Zero-Quota Waste**:
   - Real-time pre-flight verification via `getNumberId()`.
   - Any phone number not registered on WhatsApp is instantly tagged as `NOT_ON_WHATSAPP` in the CRM and skipped.
   - **Crucial**: Non-WhatsApp numbers do NOT consume the 50-daily limit and do NOT cause campaign stalling!
   - 1-Click Batch Pre-Verification tool checks pending numbers in bulk in seconds.

4. **Human Presence Emulation**:
   - `sendSeen()` glance receipt (1.2s - 2.2s before typing).
   - Realistic `sendStateTyping()` simulation (~35ms per character, 3.5s - 6.8s).
   - Spintax message randomization with unique cryptographic reference IDs (`Ref: KR-XXXX`).

5. **100% Free Programmatic 24/7 Lead Scraper**:
   - Scrapes 99acres, MagicBricks, Housing.com, OLX, YouTube, and Facebook without slow browser extensions or paid APIs.
   - Continuously harvests verified Karnal property buyers and broker partners.

6. **1-Click Downloadable CRM Lead Sheet**:
   - Instant export to UTF-8 BOM CSV / Excel with phone numbers, verification flags, and inquiry requirements.

7. **Render 24/7 Keep-Alive**:
   - Built-in 10-minute self-ping loop prevents Render free web services from idling or sleeping.

---

## 🚀 1-Click Deployment to Render via GitHub

### Step 1: Upload to GitHub
Inside this folder (`render_whatsapp_cloud`), initialize Git and push to your GitHub:
```bash
git init
git add .
git commit -m "Karnal Reality 24/7 Multi-Device WhatsApp CRM"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```
*(Or drag and drop the folder contents directly into the GitHub web interface!)*

### Step 2: Deploy on Render.com
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Render detects the `Dockerfile` automatically:
   - **Runtime**: `Docker`
   - **Region**: `Singapore` (Fastest for India)
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**!

Render will build Chromium and Node.js in ~2 minutes and provide a live URL:
`https://your-service-name.onrender.com`

---

## 📱 Linking WhatsApp SIM Devices
1. Open your live Render URL on your phone or PC.
2. In the **Multi-Device Engine** section, click **"⚡ Connect Device"** on Slot #1 (or slots 2 to 9).
3. The QR code modal will pop up.
4. On your WhatsApp phone:
   - Tap **Settings (or 3 dots) > Linked Devices > Link a Device**.
   - Point your camera at the screen QR code.
5. In 2 seconds, the slot turns **🟢 ONLINE**!
6. Click **"▶ Launch 24h Safe Outreach"** to start the autopilot engine.
