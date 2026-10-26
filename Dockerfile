# ==============================================================================
# KARNAL REALITY - WHATSAPP 24/7 CLOUD GATEWAY DOCKERFILE (RENDER.COM)
# Powered by Ultra-Lean Baileys Engine (Zero Chromium, Zero Puppeteer, ~35MB RAM)
# ==============================================================================
FROM node:20-slim

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Ensure storage directories exist with write permissions
RUN mkdir -p session_auth database assets public && chmod -R 777 session_auth database

EXPOSE 3000

CMD ["node", "server.js"]
