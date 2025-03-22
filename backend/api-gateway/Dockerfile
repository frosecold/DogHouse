# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set non-root user for security
USER node

# Set environment variables
ENV NODE_ENV=production

# Copy built application from builder stage
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health > /dev/null || exit 1

# Expose API port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"] 