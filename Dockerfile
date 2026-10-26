# ==============================================================================
# KARNAL REALITY - WHATSAPP 24/7 CLOUD GATEWAY DOCKERFILE (RENDER.COM)
# ==============================================================================
FROM node:20-bullseye-slim

# Install latest Chromium and required dependencies for Puppeteer & WhatsApp Web
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    libnss3 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    curl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables to use the system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3000

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source code
COPY . .

# Create directory for session cache with proper permissions
RUN mkdir -p session_auth .wwebjs_cache && chmod -R 777 session_auth .wwebjs_cache

EXPOSE 3000

CMD ["node", "server.js"]
