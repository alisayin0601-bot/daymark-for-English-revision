# Daymark — small production image.
# The app has no npm dependencies, so nothing is installed here.
FROM node:24-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    APP_TIMEZONE=Asia/Shanghai \
    DAYMARK_DB_PATH=/app/storage/daymark.db

WORKDIR /app

COPY package.json server.js ./
COPY server ./server
COPY public ./public

# The SQLite database lives here; mount a volume to keep it across deploys.
RUN mkdir -p /app/storage && chown -R node:node /app

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
