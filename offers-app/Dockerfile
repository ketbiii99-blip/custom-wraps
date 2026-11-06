# OFFERS app: one container serving the shopper app, admin panel and API.
# No npm packages are needed; Node's built-in SQLite stores the data in /data.
FROM node:22.23-slim

ENV NODE_ENV=production \
    PORT=8080 \
    DB_PATH=/data/offers.db \
    TRUST_PROXY=1

WORKDIR /app
COPY --chown=node:node . .

RUN mkdir -p /data && chown node:node /data
USER node

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "--no-warnings", "server/server.js"]
