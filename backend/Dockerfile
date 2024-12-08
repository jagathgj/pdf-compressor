FROM node:18
WORKDIR /app
RUN apt-get update && apt-get install -y ghostscript
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 10000
CMD ["npm", "start"]
