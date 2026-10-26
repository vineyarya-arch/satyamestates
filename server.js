// ==============================================================================
// KARNAL REALITY - 24/7 CLOUD AUTOPILOT & MULTI-DEVICE WHATSAPP CRM SERVER
// ==============================================================================
// • Serves Interactive Executive CRM Dashboard (Dark Mode)
// • Manages 9 Multi-Device WhatsApp SIM Slots (Up to 450 leads/day)
// • Adaptive 24-Hour Human Cadence (Target: Exactly 50/device, no more, no less)
// • Non-WhatsApp Mobile Filter (Unregistered numbers skipped & NOT counted)
// • 1-Click WhatsApp Pre-Verification Tool
// • Programmatic 24/7 Free Multi-Platform Scraper ($0 APIs)
// • Downloadable Real Estate Lead Sheet (CSV / Excel format)
// • 24/7 Render Keep-Alive Self-Pinger (Zero Downtime)
// • Self-Contained Local DB Storage (Zero Supabase Dependency)
// ==============================================================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const {
    devices,
    MAX_DEVICES,
    DAILY_LIMIT_PER_DEVICE,
    initializeDevice,
    disconnectDevice,
    sendViaDevice,
    sendViaAnyDevice,
    verifyNumberOnWhatsApp,
    getDevicesStatus,
    getDeviceQr,
    autoBootSavedDevices,
    setOnDeviceReadyHook
} = require('./device_manager');

// Top-level crash guards to ensure the process NEVER exits unexpectedly
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION SAFEGUARD]', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION SAFEGUARD]', reason);
});

// Zero-Touch Autopilot Hook: Auto-launches outreach campaign the moment QR is scanned
setOnDeviceReadyHook((device) => {
    console.log(`\n[ZERO-TOUCH AUTOPILOT] Device #${device.id} is ONLINE (+${device.phone})! Stabilizing session 5s before first dispatch...`);
    setTimeout(() => {
        if (!isCampaignActive) {
            isCampaignActive = true;
            runCampaignLoop(50).catch(err => console.error('[AUTOPILOT RUN ERROR]', err.message));
        }
    }, 5000);
});

const {
    runFreeScrapeCycle,
    start247ScraperLoop,
    stop247ScraperLoop,
    getScraperLogs,
    isScraperRunning
} = require('./free_scraper');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database', 'karnal_leads_db.json');

console.log('======================================================================');
console.log('   KARNAL REALITY - 24/7 CLOUD MULTI-DEVICE AUTOPILOT (RENDER.COM)    ');
console.log('   Port: ' + PORT);
console.log('   Database: ' + DB_PATH);
console.log('======================================================================');

// Database Helpers
function getLeadsDb() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const raw = fs.readFileSync(DB_PATH, 'utf8').replace(/^\uFEFF/, '');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error('DB Read error:', e);
    }
    return { leads: [] };
}

function saveLeadsDb(data) {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('DB Write error:', e);
    }
}

// Current IST Time Helper
function getISTDate() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 5.5));
}

function getISTTimeString() {
    return getISTDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

// Spintax Generator with Cryptographically Unique Hashes
function generateSpintax(salutation, loc, req, category) {
    const greetings = [
        `Namaste ${salutation}! Karnal Reality se.`,
        `Hello ${salutation}, shubh din! Karnal Reality se Viney Kumar Arya.`,
        `Pranam ${salutation}! Ummeed hai aap kushal mangal hain.`,
        `Namaste ${salutation} ji! Karnal prime property update ke regarding.`,
        `Hello ${salutation}! Karnal Reality commercial desk se.`
    ];
    const greet = greetings[Math.floor(Math.random() * greetings.length)];

    let body = "";
    if (category === 'broker_partner' || /dealer|broker|associate/i.test(req)) {
        const brokerHooks = [
            "Hum Karnal me Sector 6 DDJAY plots, ITI Chowk prime showrooms aur Pre-Rented bank assets direct hold karte hain. We can definitely work together for direct co-brokering & 50-50 tie-up.",
            "Karnal ke prime verified assets (ITI Chowk showrooms, DDJAY plots) me direct inventory hold hai. Joint deals aur investor matching ke liye we can collaborate.",
            "Hamare paas clear-title direct commercial inventory ready hai. Deal matching aur client sharing ke liye let's connect."
        ];
        body = brokerHooks[Math.floor(Math.random() * brokerHooks.length)];
    } else if (/pre\s*rented|bank|yield|roi/i.test(req)) {
        const nriHooks = [
            `Aapne ${loc} me inquiry ki thi. Hamare paas prime nationalized bank branches aur highway leases (8.2% - 9.0% Net Annual Yield) ready hain with Day 1 rent credit.`,
            `Karnal GT Road aur commercial hubs me pre-leased banks aur corporate assets (8.5% ROI) available hain. Immediate cashflow start ho jata hai.`,
            `High-yield pre-rented commercial spaces (8.5% ROI) available hain with long-term corporate leases in ${loc}.`
        ];
        body = nriHooks[Math.floor(Math.random() * nriHooks.length)];
    } else if (/showroom|commercial|shop|space/i.test(req)) {
        const commHooks = [
            `Aapne ${loc} me showroom/shop inquiry ki thi. Hamare paas ITI Chowk, Subzi Mandi aur Mughal Canal me verified high-footfall showrooms ready hain.`,
            `Karnal ke prime commercial hubs (ITI Chowk, Sector 6) me multi-storey commercial showrooms direct clear-title ready hain.`,
            `Commercial showroom inquiry ke context me: hamare paas prime locations me ₹1.10 Cr se ₹1.80 Cr ke verified high-footfall options ready hain.`
        ];
        body = commHooks[Math.floor(Math.random() * commHooks.length)];
    } else {
        const plotHooks = [
            `Aapne ${loc} me plot/land inquiry ki thi. Hamare paas Sector 6 DDJAY (Pre-launch ₹32,000/gaj) aur Alpha International City me RERA approved plots ready hain.`,
            `RERA approved prime residential & commercial plots available hain with immediate registry in Sector 6 DDJAY & Alpha City.`,
            `Sector 6 DDJAY (₹32k/gaj) aur premium gated township plots available hain with direct builder registry.`
        ];
        body = plotHooks[Math.floor(Math.random() * plotHooks.length)];
    }

    const closings = [
        "Kya hum current matching options aur pricing details share karein?",
        "Agar requirement active hai toh batayiye, direct details WhatsApp par bhej dete hain.",
        "Kya exact size aur location details review karna chahenge?"
    ];
    const close = closings[Math.floor(Math.random() * closings.length)];

    // Unique reference hash for Meta anti-spam hash defense
    const refCode = `KR-${Math.floor(1000 + Math.random() * 9000)}`;
    const menu = `\n\n------------------------\n[1] 📞 Direct Call (+91 9355312345)\n[2] 🌐 View Verified Inventory (karnalproperty.com)\n[Reply '1' ya '2' • Agar requirement close ho gayi hai toh 'STOP' likh dein]\n*Ref:* ${refCode}`;

    return `${greet}\n\n${body}\n\n${close}${menu}`;
}

// ------------------------------------------------------------------------------
// REST API ENDPOINTS
// ------------------------------------------------------------------------------

// Root / Dashboard Page
app.get(['/', '/dashboard'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// System Status & Pipeline Summary
app.get('/api/status', (req, res) => {
    const db = getLeadsDb();
    const leads = db.leads || [];
    const onlineDevs = devices.filter(d => d.status === 'READY');
    const totalSentToday = devices.reduce((sum, d) => sum + (d.sentToday || 0), 0);
    const pendingLeads = leads.filter(l => l.outreach_status === 'NEW').length;
    const notOnWaLeads = leads.filter(l => l.outreach_status === 'NOT_ON_WHATSAPP').length;
    const sentLeads = leads.filter(l => l.outreach_status === 'SENT').length;

    const istNow = getISTDate();
    const istHours = istNow.getHours();
    const istMins = istNow.getMinutes();
    const isNightMode = (istHours < 9 || (istHours === 9 && istMins < 30) || (istHours >= 20 && istMins >= 30) || istHours > 20);

    res.json({
        total_leads: leads.length,
        sent_today: totalSentToday,
        pending_leads: pendingLeads,
        not_on_whatsapp: notOnWaLeads,
        sent_leads: sentLeads,
        online_devices: onlineDevs.length,
        max_devices: MAX_DEVICES,
        daily_target_per_device: DAILY_LIMIT_PER_DEVICE,
        devices: getDevicesStatus(),
        scraper_running: isScraperRunning(),
        campaign: {
            isActive: isCampaignActive,
            pacingMode: campaignConfig.mode,
            nextMessageEtaSeconds: campaignState.nextEtaSeconds,
            isNightMode: isNightMode,
            istTime: getISTTimeString()
        },
        uptime_seconds: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// List All 9 Devices
app.get('/api/devices', (req, res) => {
    res.json({ devices: getDevicesStatus() });
});

// Get Device QR Code Status
app.get('/api/device/:id/qr', (req, res) => {
    const slotId = parseInt(req.params.id);
    const qrInfo = getDeviceQr(slotId);
    if (!qrInfo) return res.status(404).json({ error: 'Device slot not found' });
    res.json(qrInfo);
});

// Connect Specific Device Slot
app.post('/api/device/:id/connect', async (req, res) => {
    const slotId = parseInt(req.params.id);
    try {
        const result = await initializeDevice(slotId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clean Reset / Force Restart Specific Device Slot
app.post('/api/device/:id/reset', async (req, res) => {
    const slotId = parseInt(req.params.id);
    try {
        const result = await initializeDevice(slotId, true);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Disconnect Specific Device Slot
app.post('/api/device/:id/disconnect', async (req, res) => {
    const slotId = parseInt(req.params.id);
    try {
        const result = await disconnectDevice(slotId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CRM Leads List
app.get('/api/leads', (req, res) => {
    const db = getLeadsDb();
    const leads = (db.leads || []).slice().reverse();
    res.json({ count: leads.length, leads });
});

// 1-Click WhatsApp Pre-Verification of Pending Leads
app.post('/api/leads/verify-all', async (req, res) => {
    const onlineDev = devices.find(d => d.status === 'READY');
    if (!onlineDev) {
        return res.status(400).json({ error: 'Please connect at least 1 WhatsApp device to verify numbers.' });
    }

    const db = getLeadsDb();
    const pending = (db.leads || []).filter(l => l.outreach_status === 'NEW');

    if (pending.length === 0) {
        return res.json({ message: 'No pending leads to verify.', totalChecked: 0 });
    }

    // Run verification in background
    let verifiedCount = 0;
    let notOnWaCount = 0;

    (async () => {
        console.log(`[VERIFIER] Starting pre-flight WhatsApp verification on ${pending.length} pending leads...`);
        for (const lead of pending) {
            try {
                const res = await verifyNumberOnWhatsApp(lead.phone_number, onlineDev.id);
                if (res.exists) {
                    lead.whatsapp_valid = true;
                    lead.last_checked_at = new Date().toISOString();
                    verifiedCount++;
                } else {
                    lead.whatsapp_valid = false;
                    lead.outreach_status = 'NOT_ON_WHATSAPP';
                    lead.last_checked_at = new Date().toISOString();
                    lead.notes = (lead.notes ? lead.notes + '; ' : '') + 'Pre-verified: NOT on WhatsApp';
                    notOnWaCount++;
                    console.log(`[VERIFIER] +91${lead.phone_number} is NOT on WhatsApp. Flagged in DB.`);
                }
            } catch (e) {
                console.error(`[VERIFIER ERROR] +91${lead.phone_number}:`, e.message);
            }
            saveLeadsDb(db);
            // Gentle 300ms pause between lookups to prevent rate limit
            await new Promise(r => setTimeout(r, 350));
        }
        console.log(`[VERIFIER COMPLETE] Checked ${pending.length} leads: ${verifiedCount} on WhatsApp, ${notOnWaCount} NOT on WhatsApp.`);
    })().catch(() => {});

    res.json({
        success: true,
        message: `Verification started in background for ${pending.length} leads using Device #${onlineDev.id}! Refresh table in a few moments.`
    });
});

// Export Leads to Downloadable CSV Sheet
app.get('/api/export-csv', (req, res) => {
    const db = getLeadsDb();
    const leads = db.leads || [];

    const headers = [
        'ID',
        'Client / Partner Name',
        'Phone Number',
        'Formatted Phone',
        'WhatsApp Registered',
        'Locality / Area',
        'Category',
        'Requirement',
        'Budget',
        'Source Platform',
        'Outreach Status',
        'Assigned Device',
        'Created At',
        'Last Contacted At',
        'Notes'
    ];

    const escapeCsv = (val) => {
        if (val === null || val === undefined) return '""';
        const str = val.toString().replace(/"/g, '""');
        return `"${str}"`;
    };

    const rows = leads.map(l => [
        escapeCsv(l.id),
        escapeCsv(l.client_name),
        escapeCsv(l.phone_number),
        escapeCsv(l.formatted_phone || ('+91' + l.phone_number)),
        escapeCsv(l.outreach_status === 'NOT_ON_WHATSAPP' ? 'NO' : (l.whatsapp_valid ? 'YES' : 'PENDING CHECK')),
        escapeCsv(l.location),
        escapeCsv(l.category),
        escapeCsv(l.requirement),
        escapeCsv(l.budget),
        escapeCsv(l.platform),
        escapeCsv(l.outreach_status),
        escapeCsv(l.assigned_device || 'None'),
        escapeCsv(l.created_at),
        escapeCsv(l.last_contacted_at || ''),
        escapeCsv(l.notes || '')
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="karnal_reality_leads_${dateStr}.csv"`);
    res.send(csvContent);
});

// Trigger Free Scraper Cycle
app.post('/api/scraper/trigger', async (req, res) => {
    try {
        runFreeScrapeCycle(10).catch(() => {});
        res.json({ success: true, message: 'Free 24/7 lead scraper cycle triggered in background!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Live Scraper Logs
app.get('/api/scraper/logs', (req, res) => {
    res.json({ logs: getScraperLogs() });
});

// ------------------------------------------------------------------------------
// 24-HOUR ADAPTIVE HUMAN PACER & ANTI-BAN DISPATCH CAMPAIGN
// ------------------------------------------------------------------------------
// Pacing Modes:
// 1. 'ADAPTIVE_24H': Daytime business hours (09:30 AM to 08:30 PM IST). Dynamically
//    distributes remaining messages so exactly 50 per SIM are achieved by 8:30 PM.
//    At night (8:30 PM - 9:30 AM), sleeps to avoid bans and sleep-disruption complaints.
// 2. 'CONTINUOUS_24H': Runs round-the-clock 24h evenly distributing 50 messages (~28m spacing).
// 3. 'MICRO_BATCH': Human bursts of 2-3 msgs (spaced 90-140s), then 15-25m tea/work break.
// 4. 'FAST_TEST': 45-75s for quick verification.
// ------------------------------------------------------------------------------

let isCampaignActive = false;
let campaignTimeoutHandle = null;

const campaignConfig = {
    mode: 'ADAPTIVE_24H', // 'ADAPTIVE_24H', 'CONTINUOUS_24H', 'MICRO_BATCH', 'FAST_TEST'
    targetPerDevice: DAILY_LIMIT_PER_DEVICE // Strict 50
};

const campaignState = {
    nextEtaSeconds: 0,
    burstCount: 0
};

app.post('/api/campaign/config', (req, res) => {
    if (req.body.mode) campaignConfig.mode = req.body.mode;
    res.json({ success: true, config: campaignConfig });
});

app.post('/api/campaign/start', async (req, res) => {
    const target = parseInt(req.body.target) || 50;
    if (req.body.mode) campaignConfig.mode = req.body.mode;

    if (isCampaignActive) {
        return res.json({ message: 'Campaign is already actively running.' });
    }

    const onlineDevs = devices.filter(d => d.status === 'READY' && d.sentToday < d.maxDaily);
    if (onlineDevs.length === 0) {
        return res.status(400).json({ error: 'No active WhatsApp devices available with quota. Please link a device or await daily reset.' });
    }

    isCampaignActive = true;
    runCampaignLoop(target);

    res.json({
        success: true,
        message: `Adaptive safe campaign started! Mode: ${campaignConfig.mode}. Pacing target: 50 msgs/device over 24h. Online devices: ${onlineDevs.length}.`
    });
});

app.post('/api/campaign/pause', (req, res) => {
    isCampaignActive = false;
    campaignState.nextEtaSeconds = 0;
    if (campaignTimeoutHandle) clearTimeout(campaignTimeoutHandle);
    res.json({ success: true, message: 'Campaign paused successfully.' });
});

// Campaign live status query
app.get('/api/campaign/status', (req, res) => {
    const onlineDevs = devices.filter(d => d.status === 'READY');
    const db = getLeadsDb();
    const pendingCount = (db.leads || []).filter(l => l.outreach_status === 'NEW').length;
    const sentCount = (db.leads || []).filter(l => l.outreach_status === 'SENT').length;
    const notOnWaCount = (db.leads || []).filter(l => l.outreach_status === 'NOT_ON_WHATSAPP').length;

    res.json({
        isActive: isCampaignActive,
        config: campaignConfig,
        state: campaignState,
        onlineDevices: onlineDevs.length,
        pendingLeads: pendingCount,
        sentLeads: sentCount,
        notOnWaLeads: notOnWaCount,
        currentIST: getISTTimeString()
    });
});

// Calculate the optimal next human delay based on remaining time and remaining quota
function calculateHumanPacingDelay(remainingTarget) {
    const mode = campaignConfig.mode;

    if (mode === 'FAST_TEST') {
        return Math.floor(Math.random() * 30) + 45; // 45s - 75s
    }

    const istNow = getISTDate();
    const istHours = istNow.getHours();
    const istMins = istNow.getMinutes();

    // Check if outside active business hours (09:30 AM to 08:30 PM IST)
    const isNight = (istHours < 9 || (istHours === 9 && istMins < 30) || (istHours >= 20 && istMins >= 30) || istHours > 20);

    if (mode === 'ADAPTIVE_24H' && isNight) {
        // Calculate minutes until 09:30 AM IST next morning
        let minsUntilMorning = 0;
        if (istHours >= 20) {
            // After 8:30 PM: Remaining today till midnight + 9.5 hours
            const minsTillMidnight = ((23 - istHours) * 60) + (60 - istMins);
            minsUntilMorning = minsTillMidnight + (9 * 60 + 30);
        } else {
            // Before 9:30 AM: Remaining until 09:30 AM
            minsUntilMorning = ((9 - istHours) * 60) + (30 - istMins);
        }
        // Cap sleep check to 10 minutes max so system remains responsive to user pause/resume
        const checkDelaySec = Math.min(minsUntilMorning * 60, 600);
        console.log(`[HUMAN PACER - NIGHT SILENCE] IST: ${getISTTimeString()}. Outside business hours (09:30 AM - 08:30 PM). Outreach paused for human realism. Next check in ${Math.round(checkDelaySec / 60)} mins.`);
        return checkDelaySec;
    }

    if (mode === 'MICRO_BATCH') {
        campaignState.burstCount++;
        if (campaignState.burstCount % 3 === 0) {
            // Human Tea / Call Break: 14 to 22 minutes
            const teaBreakSec = Math.floor(Math.random() * 480) + 840;
            console.log(`[HUMAN PACER - BREAK] Simulating natural broker work/tea break: ${Math.round(teaBreakSec / 60)} minutes.`);
            return teaBreakSec;
        } else {
            // In-batch delay: 90s to 160s
            return Math.floor(Math.random() * 70) + 90;
        }
    }

    // Default: 'ADAPTIVE_24H' during daytime OR 'CONTINUOUS_24H'
    // Calculate minutes remaining until 08:30 PM (20:30) IST
    let minutesRemaining = 0;
    if (mode === 'CONTINUOUS_24H') {
        const totalMinutesPassed = (istHours * 60) + istMins;
        minutesRemaining = Math.max(30, 1440 - totalMinutesPassed);
    } else {
        const endMinutes = (20 * 60) + 30; // 20:30
        const currentMinutes = (istHours * 60) + istMins;
        minutesRemaining = Math.max(30, endMinutes - currentMinutes);
    }

    // Interval to achieve target evenly
    const msgsToDeliver = Math.max(1, remainingTarget);
    let intervalSeconds = Math.round((minutesRemaining * 60) / msgsToDeliver);

    // Natural Human Jitter: ±20%
    const jitter = Math.floor((Math.random() * 0.4 - 0.2) * intervalSeconds);
    let finalSeconds = intervalSeconds + jitter;

    // Safety bounds: Minimum 90 seconds (never spam), Maximum 25 minutes
    finalSeconds = Math.max(90, Math.min(1500, finalSeconds));

    return finalSeconds;
}

async function runCampaignLoop(targetCount) {
    console.log(`[CAMPAIGN LAUNCH] Mode: ${campaignConfig.mode} | Target: ${targetCount} verified deliveries | Strict Anti-Ban 50/device`);
    let sentInRun = 0;

    while (isCampaignActive && sentInRun < targetCount) {
        // 1. Check device availability and daily caps (Strict 50 - no more)
        const eligibleDevices = devices.filter(d => d.status === 'READY' && d.sentToday < d.maxDaily);
        if (eligibleDevices.length === 0) {
            const anyReady = devices.some(d => d.status === 'READY');
            if (anyReady) {
                console.log('\n======================================================================');
                console.log(' [TARGET ACHIEVED TODAY] All connected devices reached their 50/day limit!');
                console.log(' System will pause cold outreach until midnight IST reset (00:00 IST).');
                console.log(' Incoming AI auto-responder remains 100% active 24/7.');
                console.log('======================================================================\n');
            } else {
                console.log('[CAMPAIGN PAUSED] No devices currently online. Please scan QR on dashboard.');
            }
            break;
        }

        // 2. Fetch pending leads
        const db = getLeadsDb();
        const pending = (db.leads || []).filter(l => l.outreach_status === 'NEW');

        if (pending.length === 0) {
            console.log('[CAMPAIGN] All available leads in CRM have already been processed! Scraper is harvesting more...');
            // Wait 2 minutes for scraper to bring fresh leads
            await new Promise(resolve => {
                campaignTimeoutHandle = setTimeout(resolve, 120 * 1000);
            });
            continue;
        }

        const lead = pending[0];
        const p = lead.phone_number;
        const name = lead.client_name || 'ji';
        const loc = lead.location || 'Karnal City';
        const req = lead.requirement || 'Commercial Property / DDJAY Plot';
        const cat = lead.category || 'commercial';

        let salutation = 'ji';
        if (name && !/Buyer|Desk|Seeker|\d{4}/i.test(name)) {
            salutation = name.split(' ')[0] + ' ji';
        }

        const msg = generateSpintax(salutation, loc, req, cat);

        try {
            console.log(`[CAMPAIGN DISPATCH #${sentInRun + 1}/${targetCount}] Evaluating ${lead.client_name} (+91${p})...`);
            const sendResult = await sendViaAnyDevice(p, msg);

            if (sendResult.success) {
                // SUCCESSFUL DELIVERY
                lead.outreach_status = 'SENT';
                lead.whatsapp_valid = true;
                lead.last_contacted_at = new Date().toISOString();
                lead.assigned_device = `Device #${sendResult.deviceId} (+${sendResult.senderPhone})`;
                lead.notes = (lead.notes ? lead.notes + '; ' : '') + `Delivered via D#${sendResult.deviceId} at ${getISTTimeString()}`;
                saveLeadsDb(db);
                sentInRun++;

                console.log(`[DELIVERY SUCCESS] +91${p} reached via Device #${sendResult.deviceId} (SIM Progress: ${sendResult.sentToday}/50 | Campaign Run: ${sentInRun}/${targetCount})`);

            } else if (sendResult.notOnWhatsApp) {
                // CRITICAL FIX: PHONE NUMBER NOT REGISTERED ON WHATSAPP!
                // Update lead in DB so it is NEVER checked again, and DO NOT count towards daily 50 target!
                lead.outreach_status = 'NOT_ON_WHATSAPP';
                lead.whatsapp_valid = false;
                lead.last_checked_at = new Date().toISOString();
                lead.notes = (lead.notes ? lead.notes + '; ' : '') + 'Verified NOT registered on WhatsApp';
                saveLeadsDb(db);

                console.log(`[NON-WHATSAPP SKIPPED] +91${p} is NOT on WhatsApp! Marked in CRM as NOT_ON_WHATSAPP. Skipping immediately WITHOUT consuming 50-limit quota.`);

                // Rapid 2.5s pause to proceed immediately to next valid candidate
                await new Promise(r => setTimeout(r, 2500));
                continue;
            }
        } catch (err) {
            console.error(`[CAMPAIGN ERROR] Sending to +91${p}:`, err.message);
            if (err.message.includes('limit') || err.message.includes('No WhatsApp devices')) {
                console.log('[CAMPAIGN PAUSED]', err.message);
                break;
            }
            // Mark with error note and continue
            lead.outreach_status = 'ERROR';
            lead.notes = (lead.notes ? lead.notes + '; ' : '') + `Error: ${err.message}`;
            saveLeadsDb(db);
        }

        // 3. Human Pacing Delay Calculation
        if (isCampaignActive && sentInRun < targetCount) {
            const remainingToTarget = targetCount - sentInRun;
            const delaySec = calculateHumanPacingDelay(remainingToTarget);
            campaignState.nextEtaSeconds = delaySec;

            const mins = Math.floor(delaySec / 60);
            const secs = delaySec % 60;
            const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            console.log(`[HUMAN PACER] Undetectable cadence: Waiting ${timeStr} before next message (Target left: ${remainingToTarget})...`);

            await new Promise(resolve => {
                campaignTimeoutHandle = setTimeout(resolve, delaySec * 1000);
            });
            campaignState.nextEtaSeconds = 0;
        }
    }

    isCampaignActive = false;
    campaignState.nextEtaSeconds = 0;
    console.log(`[CAMPAIGN FINISHED] Outreach run concluded. Total verified deliveries: ${sentInRun}`);
}

// ------------------------------------------------------------------------------
// HEALTH & 24/7 KEEP-ALIVE (ZERO RENDER DOWNTIME)
// ------------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        devices_online: devices.filter(d => d.status === 'READY').length,
        timestamp: new Date().toISOString()
    });
});

// Zero-Env Self-ping: Automatically detects Render external URL (Zero manual configuration needed)
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || 
    (process.env.RENDER_EXTERNAL_HOSTNAME ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}` : null);

if (RENDER_EXTERNAL_URL) {
    console.log(`[KEEP-ALIVE] Auto-ping active for ${RENDER_EXTERNAL_URL} every 10 minutes (Zero Downtime / Zero Env Setup)`);
    setInterval(async () => {
        try {
            const pRes = await fetch(`${RENDER_EXTERNAL_URL}/api/health`);
            if (pRes.ok) console.log(`[KEEP-ALIVE] 24/7 Self-ping success at ${new Date().toISOString()}`);
        } catch (e) {
            console.error('[KEEP-ALIVE ERROR]', e.message);
        }
    }, 10 * 60 * 1000);
} else {
    console.log('[KEEP-ALIVE] Running in local/direct mode. Render auto-ping will activate automatically when deployed on Render.');
}

// ------------------------------------------------------------------------------
// BOOTSTRAP SERVER
// ------------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`\n======================================================================`);
    console.log(` [SERVER READY] Karnal Reality Autopilot Live on http://localhost:${PORT}`);
    console.log(` Dashboard URL: http://localhost:${PORT}/dashboard`);
    console.log(` Multi-Device Slots: 1 to ${MAX_DEVICES} (Strict 50 leads/day per SIM)`);
    console.log(` Adaptive Pacing: 24h Human Undetectable Cadence (No more, no less)`);
    console.log(`======================================================================\n`);

    // Auto-reconnect saved sessions (e.g. Device #1)
    const booted = autoBootSavedDevices();

    // Instant Boot: Pre-warm Device #1 on boot so QR is ALREADY generated on startup (Blink Fast!)
    if (!booted || !booted.includes(1)) {
        console.log('[INSTANT BOOT] Pre-warming Device #1 on boot so QR code generates in advance with ZERO wait time...');
        initializeDevice(1).catch(err => console.error('[PRE-WARM NOTICE]', err.message));
    }

    // Auto-start 24/7 background free scraper loop (runs every 20 mins)
    start247ScraperLoop(20);
});
