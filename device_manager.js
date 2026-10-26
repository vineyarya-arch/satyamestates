// ==============================================================================
// KARNAL REALITY - MULTI-DEVICE WHATSAPP MANAGER (UP TO 9 DEVICES)
// ==============================================================================
// • Manages up to 9 distinct WhatsApp Web device slots (Device #1 to #9)
// • Strict 50 Leads / 24 Hours Anti-Ban Cap per Device (Target: 50 no more, no less)
// • Non-WhatsApp Detection (getNumberId validation - unregistered numbers skipped without counting)
// • Human Presence Simulation (Seen glance + Natural Typing + Micro-pauses)
// • Automated Round-Robin Load Balancing across all online devices
// • Batch WhatsApp Pre-Verification Tool (clean leads in seconds)
// • AI Auto-Responder routing for all incoming conversations across all devices
// • Independent QR Generation & Session Caching per slot
// ==============================================================================

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { handleIncomingMessage } = require('./ai_responder');

const MAX_DEVICES = 9;
const DAILY_LIMIT_PER_DEVICE = 50;
const SESSION_DATA_PATH = path.join(__dirname, 'session_auth');
const STATS_PATH = path.join(__dirname, 'database', 'device_stats.json');

// Chromium executable path resolution (Docker/Render/Windows)
let chromePath = process.env.PUPPETEER_EXECUTABLE_PATH;
if (!chromePath) {
    if (process.platform === 'win32') {
        chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
        if (!fs.existsSync(chromePath)) {
            chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
        }
    } else {
        chromePath = '/usr/bin/chromium';
        if (!fs.existsSync(chromePath)) {
            chromePath = '/usr/bin/chromium-browser';
        }
    }
}

// Persistent Stats Loader
function loadStats() {
    try {
        if (fs.existsSync(STATS_PATH)) {
            const raw = fs.readFileSync(STATS_PATH, 'utf8').replace(/^\uFEFF/, '');
            const parsed = JSON.parse(raw);
            const todayStr = new Date().toISOString().slice(0, 10);
            if (parsed.date === todayStr) return parsed.devices || {};
        }
    } catch (e) {}
    return {};
}

function saveStats(statsObj) {
    try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const dir = path.dirname(STATS_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(STATS_PATH, JSON.stringify({ date: todayStr, devices: statsObj }, null, 2), 'utf8');
    } catch (e) {}
}

const persistentStats = loadStats();

// Device Registry (Slots 1 to 9)
const devices = [];

for (let i = 1; i <= MAX_DEVICES; i++) {
    const slotStats = persistentStats[i] || { sentToday: 0, lastSent: null };
    devices.push({
        id: i,
        name: i === 1 ? 'Device #1 (Primary)' : `Device #${i}`,
        status: 'STANDBY', // STANDBY, CONNECTING, QR_READY, READY, ERROR
        phone: null,
        pushname: null,
        qrDataUrl: '',
        client: null,
        sentToday: slotStats.sentToday || 0,
        maxDaily: DAILY_LIMIT_PER_DEVICE,
        lastSentTime: slotStats.lastSent || null,
        lastError: null
    });
}

function persistAllStats() {
    const obj = {};
    for (const d of devices) {
        obj[d.id] = { sentToday: d.sentToday, lastSent: d.lastSentTime, phone: d.phone };
    }
    saveStats(obj);
}

function getDeviceSummary(d) {
    return {
        id: d.id,
        name: d.name,
        status: d.status,
        phone: d.phone,
        pushname: d.pushname,
        hasQr: !!d.qrDataUrl,
        sentToday: d.sentToday,
        maxDaily: d.maxDaily,
        remainingToday: Math.max(0, d.maxDaily - d.sentToday),
        lastSentTime: d.lastSentTime,
        lastError: d.lastError
    };
}

// Initialize a specific device slot
async function initializeDevice(slotId) {
    const device = devices.find(d => d.id === slotId);
    if (!device) throw new Error(`Invalid device slot ${slotId}`);

    if (device.status === 'READY') {
        return { message: 'Device is already connected and ready', device: getDeviceSummary(device) };
    }

    if (device.client) {
        try { await device.client.destroy(); } catch (_) {}
        device.client = null;
    }

    device.status = 'CONNECTING';
    device.qrDataUrl = '';
    device.lastError = null;

    console.log(`[DEVICE #${slotId}] Starting WhatsApp Client (Slot ${slotId})...`);

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: `slot_${slotId}`,
            dataPath: SESSION_DATA_PATH
        }),
        puppeteer: {
            executablePath: chromePath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                '--window-size=1366,768'
            ]
        }
    });

    device.client = client;

    client.on('qr', async (qr) => {
        console.log(`[DEVICE #${slotId}] Fresh QR Code received! Generating visual code...`);
        try {
            device.status = 'QR_READY';
            device.qrDataUrl = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
        } catch (err) {
            console.error(`[DEVICE #${slotId} QR ERROR]`, err);
        }
    });

    client.on('ready', () => {
        device.status = 'READY';
        device.qrDataUrl = '';
        device.phone = client.info?.wid?.user || null;
        device.pushname = client.info?.pushname || 'Active SIM';
        console.log(`\n======================================================================`);
        console.log(` [DEVICE #${slotId} READY] Connected! Phone: +${device.phone} (${device.pushname})`);
        console.log(` Daily Quota: ${device.sentToday} / ${device.maxDaily} messages (Strict 50-limit enforced)`);
        console.log(`======================================================================\n`);
        persistAllStats();
    });

    client.on('authenticated', () => {
        console.log(`[DEVICE #${slotId}] WhatsApp Authenticated Successfully!`);
    });

    client.on('auth_failure', (msg) => {
        console.error(`[DEVICE #${slotId} AUTH FAILURE]`, msg);
        device.status = 'ERROR';
        device.lastError = 'Authentication failed. Please re-scan QR.';
    });

    client.on('disconnected', (reason) => {
        console.log(`[DEVICE #${slotId} DISCONNECTED]`, reason);
        device.status = 'STANDBY';
        device.phone = null;
        device.qrDataUrl = '';
    });

    // Handle Incoming Messages across this device
    client.on('message', async (msg) => {
        try {
            if (msg.fromMe || !msg.body) return;

            let realPhone = msg.from;
            let senderName = '';
            try {
                const contact = await msg.getContact();
                if (contact && contact.number) realPhone = contact.number;
                senderName = contact.pushname || contact.name || '';
            } catch (_) {}

            const text = msg.body;
            console.log(`[INCOMING D#${slotId}] From +${realPhone} ("${senderName}"): "${text}"`);

            const reply = await handleIncomingMessage(realPhone, text, senderName);
            if (reply) {
                console.log(`[AI AUTO-REPLY D#${slotId}] Replying to +${realPhone}...`);
                await msg.reply(reply);
                console.log(`[AI SUCCESS D#${slotId}] Reply delivered!`);
            }
        } catch (err) {
            console.error(`[AI ERROR D#${slotId}]`, err.message);
        }
    });

    try {
        client.initialize().catch(err => {
            console.error(`[DEVICE #${slotId} INIT ERROR]`, err.message);
            device.status = 'ERROR';
            device.lastError = err.message;
        });
    } catch (err) {
        device.status = 'ERROR';
        device.lastError = err.message;
    }

    return { message: `Device #${slotId} initialized. Please scan QR.`, device: getDeviceSummary(device) };
}

// Disconnect / Logout specific device
async function disconnectDevice(slotId) {
    const device = devices.find(d => d.id === slotId);
    if (!device) throw new Error(`Invalid device slot ${slotId}`);

    if (device.client) {
        try { await device.client.logout(); } catch (_) {}
        try { await device.client.destroy(); } catch (_) {}
        device.client = null;
    }

    device.status = 'STANDBY';
    device.phone = null;
    device.qrDataUrl = '';
    device.pushname = null;
    console.log(`[DEVICE #${slotId}] Disconnected and reset to Standby.`);
    return { success: true, message: `Device #${slotId} disconnected.` };
}

// Find online device with available quota
function getBestAvailableDevice() {
    const readyDevices = devices.filter(d => d.status === 'READY' && d.sentToday < d.maxDaily);
    if (readyDevices.length === 0) return null;

    // Pick the device with the lowest sentToday, secondary by oldest lastSentTime
    readyDevices.sort((a, b) => {
        if (a.sentToday !== b.sentToday) return a.sentToday - b.sentToday;
        return (new Date(a.lastSentTime || 0)) - (new Date(b.lastSentTime || 0));
    });

    return readyDevices[0];
}

// Check if a specific phone number is registered on WhatsApp using an active device
async function verifyNumberOnWhatsApp(targetPhone, preferredSlotId = null) {
    let cleanPhone = targetPhone.toString().replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    let device = null;
    if (preferredSlotId) {
        device = devices.find(d => d.id === preferredSlotId && d.status === 'READY');
    }
    if (!device) {
        device = devices.find(d => d.status === 'READY');
    }

    if (!device || !device.client) {
        throw new Error('No online WhatsApp device available to verify number.');
    }

    try {
        const numberDetails = await device.client.getNumberId(cleanPhone);
        if (numberDetails && numberDetails._serialized) {
            return {
                exists: true,
                jid: numberDetails._serialized,
                phone: cleanPhone,
                rawPhone: cleanPhone.replace(/^91/, '')
            };
        } else {
            return {
                exists: false,
                jid: null,
                phone: cleanPhone,
                rawPhone: cleanPhone.replace(/^91/, '')
            };
        }
    } catch (err) {
        console.error(`[VERIFY NUMBER ERROR] +${cleanPhone}:`, err.message);
        return {
            exists: false,
            error: err.message,
            phone: cleanPhone,
            rawPhone: cleanPhone.replace(/^91/, '')
        };
    }
}

// Send message via specific device with Human Typing Emulation & Non-WhatsApp Detection
async function sendViaDevice(slotId, targetPhone, message) {
    const device = devices.find(d => d.id === slotId);
    if (!device || device.status !== 'READY') {
        throw new Error(`Device #${slotId} is not connected or ready.`);
    }

    if (device.sentToday >= device.maxDaily) {
        throw new Error(`Device #${slotId} reached its 50 leads daily safety limit (${device.sentToday}/${device.maxDaily}).`);
    }

    let phone = targetPhone.toString().replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone;

    const client = device.client;
    let targetChatId = null;

    // 1. STRICT PRE-FLIGHT VERIFICATION: Check if number exists on WhatsApp
    try {
        const numberDetails = await client.getNumberId(phone);
        if (!numberDetails || !numberDetails._serialized) {
            console.log(`[VALIDATION] +${phone} is NOT on WhatsApp. Skipping without counting towards daily quota.`);
            return {
                success: false,
                notOnWhatsApp: true,
                phone: phone.replace(/^91/, ''),
                error: 'Phone number is not registered on WhatsApp.'
            };
        }
        targetChatId = numberDetails._serialized;
    } catch (checkErr) {
        console.error(`[VALIDATION ERROR] Checking +${phone}:`, checkErr.message);
        return {
            success: false,
            error: checkErr.message,
            phone: phone.replace(/^91/, '')
        };
    }

    // 2. Full Human Presence Emulation (Seen glance + Natural Typing + Realistic Pauses)
    try {
        const chat = await client.getChatById(targetChatId);
        
        // Step A: Mark as seen / open conversation (1.2s - 2.2s human glance)
        await chat.sendSeen();
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 1000) + 1200));

        // Step B: Send composing/typing presence
        await chat.sendStateTyping();

        // Step C: Realistic human typing delay based on message length (~35ms per character)
        // Bounded between 3.5s and 6.8s with natural human jitter
        const charTypingMs = Math.min(6800, Math.max(3500, message.length * 35));
        const jitter = Math.floor(Math.random() * 800) - 400;
        await new Promise(r => setTimeout(r, charTypingMs + jitter));

        // Step D: Micro-pause before pressing send (simulates human final check)
        await chat.clearState();
        await new Promise(r => setTimeout(r, 450 + Math.floor(Math.random() * 350)));
    } catch (e) {
        // Fallback if chat presence simulation encounters minor issue
    }

    // 3. Dispatch Unique Message
    const sent = await client.sendMessage(targetChatId, message);
    const msgId = (sent && sent.id) ? (sent.id._serialized || sent.id.id || 'sent') : ('msg_' + Date.now());

    // ONLY INCREMENT QUOTA ON VERIFIED REAL WHATSAPP DELIVERY!
    device.sentToday++;
    device.lastSentTime = new Date().toISOString();
    persistAllStats();

    console.log(`[DELIVERED via D#${slotId}] To +${phone}! Msg ID: ${msgId} (Device Quota: ${device.sentToday}/${device.maxDaily})`);

    return {
        success: true,
        deviceId: device.id,
        deviceName: device.name,
        senderPhone: device.phone,
        recipientPhone: phone.replace(/^91/, ''),
        msgId: msgId,
        sentToday: device.sentToday,
        maxDaily: device.maxDaily,
        remainingToday: Math.max(0, device.maxDaily - device.sentToday)
    };
}

// Send via ANY best available online device (Load-Balanced)
async function sendViaAnyDevice(targetPhone, message) {
    const bestDevice = getBestAvailableDevice();
    if (!bestDevice) {
        const anyReady = devices.some(d => d.status === 'READY');
        if (anyReady) {
            throw new Error('All active devices have reached their strict 50 messages/day limit. Target achieved for today!');
        } else {
            throw new Error('No WhatsApp devices are connected. Please connect at least 1 device via QR scan.');
        }
    }

    return await sendViaDevice(bestDevice.id, targetPhone, message);
}

// Auto-boot: Auto-reconnect device #1 or any slot that already has cached credentials
function autoBootSavedDevices() {
    for (let i = 1; i <= MAX_DEVICES; i++) {
        const slotDir = path.join(SESSION_DATA_PATH, `session-slot_${i}`);
        if (fs.existsSync(slotDir)) {
            console.log(`[AUTO-BOOT] Found existing session for Device #${i}. Reconnecting...`);
            initializeDevice(i).catch(() => {});
        }
    }
}

// Reset daily quotas at midnight IST (18:30 UTC / 00:00 IST)
function scheduleDailyReset() {
    setInterval(() => {
        const now = new Date();
        const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
        const istMinutes = (now.getUTCMinutes() + 30) % 60;
        if (istHours === 0 && istMinutes === 0) {
            console.log('[DAILY RESET] Midnight IST reached! Resetting all 9 devices to 0/50 for a fresh day...');
            for (const d of devices) d.sentToday = 0;
            persistAllStats();
        }
    }, 60 * 1000);
}

scheduleDailyReset();

module.exports = {
    devices,
    MAX_DEVICES,
    DAILY_LIMIT_PER_DEVICE,
    initializeDevice,
    disconnectDevice,
    sendViaDevice,
    sendViaAnyDevice,
    getBestAvailableDevice,
    verifyNumberOnWhatsApp,
    autoBootSavedDevices,
    getDevicesStatus: () => devices.map(getDeviceSummary),
    getDeviceQr: (slotId) => {
        const d = devices.find(x => x.id === slotId);
        return d ? { status: d.status, qrDataUrl: d.qrDataUrl, phone: d.phone } : null;
    }
};
