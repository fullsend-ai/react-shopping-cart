FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
# npm install (not ci): upstream lockfile drifts from package.json at times
RUN npm install --no-audit --no-fund

COPY . .

# never try to open a browser from inside the container
ENV BROWSER=none

EXPOSE 3000

CMD ["npm", "start"]
