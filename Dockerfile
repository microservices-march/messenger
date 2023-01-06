FROM node:19.3.0-bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init
ENV PORT 4000
ENV NODE_ENV production
WORKDIR /usr/src/app
COPY --chown=node:node . .
RUN npm ci --only=production
USER node
CMD ["dumb-init", "node", "index.mjs"]