FROM node:14
#ENV NODE_ENV=production

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

#RUN npm install --production
RUN npm install

COPY . .

RUN npm run build

CMD [ "node", "build/index.js" ]