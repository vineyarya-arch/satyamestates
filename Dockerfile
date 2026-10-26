# ==============================================================================
# KARNAL REALITY - WHATSAPP 24/7 CLOUD GATEWAY DOCKERFILE (RENDER.COM)
# Powered by Ultra-Lean Baileys Engine (Zero Chromium, Zero Puppeteer, ~35MB RAM)
# ==============================================================================
FROM node:20

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Install dependencies (Node:20 includes git & build tools required by Baileys libsignal)
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy application source code
COPY . .

# Ensure storage directories exist with write permissions
RUN mkdir -p session_auth database assets public && chmod -R 777 session_auth database assets public

EXPOSE 3000

CMD ["node", "server.js"]
