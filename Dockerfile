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
# Stage 2: Prepare Nginx to Serve Static Files
# =========================================

FROM nginx:alpine AS runner

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static build output from the build stage to Nginx's default HTML serving directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 to allow HTTP traffic
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

