FROM node:16.16-bullseye

COPY cortex-cli.tgz /app/
COPY scripts/entrypoint.sh /
RUN apt-get update
RUN apt-get install -y libsecret-1-dev
RUN npm install -g /app/cortex-cli.tgz \
  && echo "default:x:1001:0:Default Application User:/app:/sbin/nologin" >> /etc/passwd \
  && chown -R 1001 /app
USER 1001
ENTRYPOINT ["/entrypoint.sh"]
