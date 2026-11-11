# Dev image for the app. Matches package.json/README: Node 22, npm, lockfile v3.
# Full bookworm (not slim) so better-sqlite3 can compile if no prebuilt binary matches.
FROM node:22-bookworm

WORKDIR /app

# Install deps first so this layer is cached until package*.json changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# --host so Vite listens on 0.0.0.0 and is reachable from outside the container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
