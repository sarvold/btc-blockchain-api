FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apt-get update && \
    apt-get install -y redis-tools telnet

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

