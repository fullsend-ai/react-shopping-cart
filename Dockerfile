FROM node:24-alpine

WORKDIR /app
# WORKDIR creates /app owned by root; hand it to `node` before dropping
# privileges, or npm ci cannot create node_modules inside it.
RUN chown node:node /app

# Files land owned by the unprivileged user, so nothing at install or run time
# needs root inside the container.
COPY --chown=node:node package.json package-lock.json ./

# Install as `node`, not root: package install scripts then run without root too.
USER node
# npm ci pins the install to the lockfile regenerated in step 1, so a drifted
# lockfile fails here instead of silently shipping a different tree. The guard
# catches npm's own failure mode: a dead registry fetch exits 0 with an empty
# node_modules, producing an image that only fails once it is running.
RUN npm ci --no-audit --no-fund && npm cache clean --force \
 && test -x node_modules/.bin/react-scripts

COPY --chown=node:node . .

# never try to open a browser from inside the container
ENV BROWSER=none

EXPOSE 3000

CMD ["npm", "start"]
