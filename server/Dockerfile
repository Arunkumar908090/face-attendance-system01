FROM node:20

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]