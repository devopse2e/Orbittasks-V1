
# Stage 1: Builder (installs deps and prepares app; no mandatory build if not needed)
FROM node:18-alpine AS build

# Install tzdata
RUN apk update && apk add --no-cache tzdata

# Set default (overridden by docker-compose)
ENV TZ=Asia/Kolkata

WORKDIR /app

# Copy package files and install ALL dependencies (including devDeps)
COPY package*.json ./
RUN npm cache clean --force && \
    npm ci && \
    npm cache verify

# Copy source code (no build step needed; just copy for test/prod)
COPY . .

# Stage 2: Test (for running npm test in a container)
#FROM node:18-alpine AS test

#WORKDIR /app

# Copy from builder (includes deps and source)
#COPY --from=build /app /app

# Command to run tests (can be overridden)
#CMD ["npm", "test", "--", "--ci"]

# Stage 3: Production (lean runtime image)
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm cache clean --force && \
    npm ci --only=production && \
    npm prune --production && \
    npm cache verify

# Copy application from builder, with ownership change
COPY --from=build --chown=nodejs:nodejs /app .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check (pings /health endpoint; adjust if your app has a different health route)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Run the server
CMD ["npm", "start"]
