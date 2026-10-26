# ==============================================================================
# KARNAL REALITY - WHATSAPP 24/7 CLOUD GATEWAY DOCKERFILE (RENDER.COM)
# ==============================================================================
FROM node:20-slim

# Install latest Chromium and required dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcups2 \
    curl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Permissions for persistent session cache
RUN mkdir -p session_auth .wwebjs_cache && chmod -R 777 session_auth .wwebjs_cache

EXPOSE 3000

CMD ["node", "server.js"]
