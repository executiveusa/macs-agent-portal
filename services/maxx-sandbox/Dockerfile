FROM node:22-bookworm-slim

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends bash ca-certificates curl git jq python3 \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 maxxsandbox \
  && useradd --uid 10001 --gid maxxsandbox --create-home --home-dir /home/maxxsandbox --shell /bin/bash maxxsandbox

WORKDIR /app
COPY services/maxx-sandbox/package.json ./package.json
COPY services/maxx-sandbox/server.mjs ./server.mjs

RUN mkdir -p /workspace/pups && chown -R maxxsandbox:maxxsandbox /workspace /app /home/maxxsandbox

USER maxxsandbox
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8790
ENV MAXX_SANDBOX_ROOT=/workspace

EXPOSE 8790
CMD ["node", "server.mjs"]
