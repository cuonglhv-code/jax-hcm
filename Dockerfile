FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/
RUN npm install
COPY . .
EXPOSE 4000 5173
CMD ["npm", "run", "dev"]
