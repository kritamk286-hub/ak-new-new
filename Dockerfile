# Use official LTS Node.js 22 runtime
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Configure build-time environment variables
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

# Copy package definitions and npm configuration
COPY package*.json .npmrc* ./

# Install all dependencies required for the Vite build pipeline
RUN npm install --legacy-peer-deps --include=dev

# Copy application source code
COPY . .

# Build Vite frontend client bundle into dist/ (relies solely on vite build, no esbuild needed)
RUN npm run build

# Configure production runtime environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose application port (default 3000, dynamically overridden by blitz.cloud/cloud hosts)
EXPOSE 3000

# Start production server using tsx
CMD ["npx", "tsx", "server.ts"]
