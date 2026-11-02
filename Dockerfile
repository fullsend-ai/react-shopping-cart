FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# never try to open a browser from inside the container
ENV BROWSER=none

EXPOSE 3000

CMD ["npm", "start"]
