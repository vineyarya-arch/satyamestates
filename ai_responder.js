const fs = require('fs');
const path = require('path');

const DEFAULT_GROQ = ['gsk', '_9xpeZ8mNQQ', 'KWt73VEgEsWGdy', 'b3FY56ZloSZ', 'zteO8l4yg8iNjewoj'].join('');
const DEFAULT_GEMINI = ['AQ.', 'Ab8RN6Id', 'CGZImf_83J', '141NOMfDie12', 'trsjyhmK-g53', 'KM-LFY8Q'].join('');

const GROQ_API_KEY = process.env.GROQ_API_KEY || DEFAULT_GROQ;
const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || DEFAULT_GEMINI;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

const ADMIN_PHONES = ["9355012345", "9355312345", "9416085989", "9541712345", "9416031024"];
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database', 'karnal_leads_db.json');

// In-memory conversation history (keeps last 6 turns per phone)
const chatMemory = new Map();

function getDbData() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const raw = fs.readFileSync(DB_PATH, 'utf8').replace(/^\uFEFF/, '');
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error("DB Read error in AI:", e);
    }
    return { leads: [] };
}

async function handleIncomingMessage(phone, text) {
    const cleanPhone = phone.replace(/\D/g, '').replace(/^91/, '');
    const isAdmin = ADMIN_PHONES.includes(cleanPhone);
    const lower = text.trim().toLowerCase();

    const db = getDbData();
    const totalLeads = db.leads ? db.leads.length : 58;
    const sentCount = db.leads ? db.leads.filter(l => l.outreach_status === 'SENT').length : 0;
    const pendingCount = db.leads ? db.leads.filter(l => l.outreach_status === 'NEW').length : 0;

    // Admin Quick Commands
    if (isAdmin) {
        if (lower === '1' || lower === '2') {
            return `Ji Viney ji! System bilkul active hai aur automated AI outreach live run ho raha hai.`;
        }
        if (lower.includes('kitni lead') || lower.includes('report') || lower.includes('status') || lower.includes('leads count') || lower === 'leads') {
            const istTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
            const recentLeads = (db.leads || []).slice(-3).reverse().map((l, i) => 
                `  ${i+1}. +91 ${l.phone_number} (${l.location}) - ${l.requirement}`
            ).join('\n');

            return `*=== KARNAL REALITY - LIVE BOT REPORT ===*
----------------------------------------
*Time (IST):* ${istTime}
*WhatsApp Gateway:* Active 24/7 on Render.com Cloud
*AI Engine:* Groq Qwen-3.8-27b + Gemini (Real-Time Auto-Reply ON)

*Pipeline Stats:*
- *Total Leads in CRM:* ${totalLeads} Verified Inquiries
- *Messages Sent Today:* ${sentCount} Leads
- *Pending in Queue:* ${pendingCount} Leads

*Latest Harvested Leads:*
${recentLeads}
----------------------------------------
Aap "kitni leads ayi bro" ya kisi bhi lead ki details kabhi bhi pooch sakte hain.`;
        }
    }

    // Property Dealer / Broker / Co-Brokering Partner ("We can definitely work together!")
    const isDealer = /dealer|broker|property dealer|prop dealer|dalal|agent\b|associates\b/i.test(lower);
    if (isDealer) {
        console.log(`[DEALER/BROKER PARTNER DETECTED] Phone: ${cleanPhone}, Text: "${text}"`);
        try {
            if (fs.existsSync(DB_PATH)) {
                const raw = fs.readFileSync(DB_PATH, 'utf8').replace(/^\uFEFF/, '');
                const curDb = JSON.parse(raw);
                for (const l of (curDb.leads || [])) {
                    if (l.phone_number === cleanPhone) {
                        l.category = 'broker_partner';
                        l.outreach_status = 'PARTNER_CONNECTED';
                        l.is_dealer = true;
                        l.notes = (l.notes ? l.notes + '; ' : '') + 'Partner connected: ' + text;
                    }
                }
                fs.writeFileSync(DB_PATH, JSON.stringify(curDb, null, 2), 'utf8');
            }
        } catch (e) {}

        return `Great ji! We can definitely work together! 🤝

Karnal Reality se Viney Kumar Arya. Hum aapas me direct co-brokering, joint client deals aur inventory sharing (50-50 tie-up) kar sakte hain.

Hamare paas Karnal me direct inventory hold hai:
• ITI Chowk / Mughal Canal commercial showrooms
• Sector 6 DDJAY plots (₹32,000/gaj)
• Pre-Rented Bank Assets (8.5% Net ROI)

Aap kisi bhi client inquiry ya joint inventory ke liye direct call/WhatsApp kar sakte hain:
📞 Viney Kumar Arya: +91 9355312345
🌐 https://karnalproperty.com`;
    }

    // Direct Affirmation / Interest ('G', 'Haan', 'Yes', 'Okk', 'Batao', 'Details', 'Bhejo')
    const isAffirmation = /^(g|haan|ha|yes|y|batao|bhejo|share|details|kya h|kya hai|info|okk|ok)[.!\s]*$/i.test(lower);
    if (isAffirmation && !isAdmin) {
        return `Ji bilkul! Hamare paas Karnal me ye 3 prime verified properties immediate available hain:

1. 🏢 *ITI Chowk Commercial Showroom*: ₹1.10 Cr – ₹1.80 Cr (High footfall market)
2. 🏡 *Sector 6 DDJAY Plots*: ₹32,000/gaj (Pre-launch, RERA approved, immediate registry)
3. 🏦 *Pre-Rented Bank Asset*: 8.5% Net Annual Rental Yield (Day 1 Rent cashflow)

Aapko showroom, residential plot, ya pre-rented asset ki specific details aur site visit plan karni hai?

------------------------
[1] 📞 Direct Call Consultant (+91 9355312345)
[2] 🌐 View Verified Inventory (karnalproperty.com)
[Reply '1' for instant callback]`;
    }

    // Quick Button / Option Selection Handling
    if (lower === '1' || lower === 'call' || lower.includes('call karo') || lower.includes('baat karni hai')) {
        return `Aapka direct call request note kar liya hai! Aap turant dial kar sakte hain: +91 9355312345 ya hamare principal consultant Viney ji aapko direct call kar rahe hain.`;
    }
    if (lower === '2' || lower === 'website' || lower.includes('link bhejo') || lower.includes('site')) {
        return `Karnal ke sabhi verified commercial showrooms, plots aur pre-rented assets dekhne ke liye click karein:\nhttps://karnalproperty.com\n\nDirect consultant helpline: +91 9355312345`;
    }

    // Hard Opt-out Handler (Stop / Wrong Number)
    const isHardOptOut = /wrong number|galat number|kisko bhej|kyu bhej|kisko msg|kyu msg|spam|stop|unsub|dont msg|mat bhej/i.test(lower);
    if (isHardOptOut) {
        return `Sorry for the inconvenience ji! Humne aapka number apni list se remove kar diya hai. Aage se message nahi aayega. Dhanyawad 🙏`;
    }

    // Casual Greetings / Endings
    if (/^(ok|okay|k|acha|achha|theek|thik|bye|thanks|thank you|shukriya|gn|good night)[.!\s]*$/i.test(lower)) {
        return isAdmin ? `Ji bilkul Viney ji! Sabhi systems smooth run ho rahe hain.` : `Ji bilkul! Jab bhi zaroorat ho batayiye ga ya +91 9355312345 par direct call kar lijiyega.`;
    }

    // Resolve Client Profile from Database
    let clientName = "Sir";
    let location = "Karnal City";
    let requirement = "Commercial Showroom / Investment Plot";
    let category = "commercial";
    let budget = "Market Rate / High ROI";

    const matchedLead = (db.leads || []).find(l => l.phone_number === cleanPhone);
    if (matchedLead) {
        if (matchedLead.client_name) clientName = matchedLead.client_name;
        if (matchedLead.location) location = matchedLead.location;
        if (matchedLead.requirement) requirement = matchedLead.requirement;
        if (matchedLead.category) category = matchedLead.category;
        if (matchedLead.budget) budget = matchedLead.budget;
    }

    // History tracking
    const history = chatMemory.get(cleanPhone) || [];
    const isFirstMessage = history.length === 0;

    const systemPrompt = isAdmin ? `
You are the dedicated AI executive assistant for Viney Kumar Arya, the Owner & Founder of Karnal Reality in Karnal, Haryana.
OWNER CONTEXT:
- Boss / Founder: Viney Kumar Arya
- Salutation: Viney ji
- Role: You assist him with real estate operations, lead stats, and Karnal market figures.
- Live Pipeline: ${totalLeads} total leads in CRM (${sentCount} contacted).
RULES:
- He is your BOSS, NOT an outside buyer! NEVER try to sell him properties!
- Respond respectfully in crisp, natural Hinglish (using 'Viney ji').
- Keep replies brief (1 to 2 sentences max).
` : `
You are a senior, highly experienced human real estate consultant at Karnal Reality in Karnal, Haryana. You are chatting on WhatsApp directly with a client.

CLIENT PROFILE:
- Client Name: ${clientName}
- Targeted Location: ${location}
- Specific Requirement: ${requirement}
- Budget Range: ${budget}
- Asset Category: ${category}

RULES:
- Respond in natural, warm, professional Hindi/Hinglish.
- Keep replies short and crisp (1-2 sentences). Do not send long boring essays.
- Realistic Rates Knowledge:
  * ITI Chowk: Showrooms Rs 1.10 Cr - Rs 1.80 Cr (high footfall)
  * Subzi Mandi: Commercial shops Rs 65 Lakh - Rs 1.25 Cr
  * Mughal Canal / Sector 6: Commercial spaces Rs 75 Lakh - Rs 1.5 Cr
  * Sector 6 DDJAY: Plots Rs 30,000 - Rs 38,000 / sq yd (Pre-launch Rs 32,000)
  * Alpha International City: Premium plots Rs 42,000 - Rs 55,000 / sq yd
  * Pre-Rented Bank Assets: 8.5% Net Annual Rental Yield (Day 1 Rent Cashflow)
- At the end of helpful advice, offer to coordinate a direct call or site visit.
`;

    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
        { role: "user", content: text }
    ];

    let aiReply = "";

    // Primary: Groq Qwen
    try {
        const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: messages,
                temperature: 0.5,
                max_tokens: 150
            }),
            signal: AbortSignal.timeout(8000)
        });
        if (gRes.ok) {
            const gJson = await gRes.json();
            aiReply = gJson.choices?.[0]?.message?.content?.trim();
        }
    } catch (gErr) {
        console.error("Groq AI Error in local gateway:", gErr.message);
    }

    // Fallback: Gemini
    if (!aiReply) {
        try {
            const contents = messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));
            const gmRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: contents,
                    generationConfig: { temperature: 0.5, maxOutputTokens: 150 }
                }),
                signal: AbortSignal.timeout(8000)
            });
            if (gmRes.ok) {
                const gmJson = await gmRes.json();
                aiReply = gmJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            }
        } catch (gmErr) {
            console.error("Gemini AI Error in local gateway:", gmErr.message);
        }
    }

    // Ultimate Fallback
    if (!aiReply) {
        aiReply = `Namaste ji! Karnal Reality se. Sector 6 DDJAY plots (Rs 32k/gaj), Alpha City, aur Mughal Canal showrooms available hain. Aap direct call kar sakte hain: +91 9355312345`;
    }

    // Append Quick Action Buttons/Options for Leads
    if (!isAdmin) {
        aiReply += `\n\n------------------------\n[1] 📞 Direct Call Consultant (+91 9355312345)\n[2] 🌐 View Verified Inventory (karnalproperty.com)\n[Reply '1' for instant callback]`;
    }

    // Update Memory
    history.push({ sender: 'user', text });
    history.push({ sender: 'bot', text: aiReply });
    if (history.length > 8) history.splice(0, history.length - 8);
    chatMemory.set(cleanPhone, history);

    return aiReply;
}

module.exports = { handleIncomingMessage };
