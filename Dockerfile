# =========================================
# Stage 1: Build the React Application
# =========================================
# Using regular Node.js (not Alpine) to avoid issues with optional dependencies
# Alpine uses musl which has problems with rollup's optional dependencies
ARG NODE_VERSION=22-slim

FROM node:${NODE_VERSION} AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json first
COPY package.json ./

# Install project dependencies
# Removing package-lock.json to fix npm bug with optional dependencies
# This ensures rollup's native binaries are properly installed
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit

# Copy the rest of the application source code into the container
COPY . .

# Build the React application (outputs to /app/dist)
# Set NODE_ENV to production for optimal build
ENV NODE_ENV=production
RUN npm run build

# =========================================
# Stage 2: Serve with Express Proxy Server
# =========================================

FROM node:${NODE_VERSION} AS runner

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only
RUN npm ci --only=production --no-audit || npm install --only=production --no-audit

# Copy the static build output from the build stage
COPY --from=builder /app/dist ./dist

# Copy server file
COPY server.js ./

# Expose port 8880 to allow HTTP traffic
EXPOSE 8880

# Set environment variable for port
ENV PORT=8880

# Start Express server
CMD ["node", "server.js"]

