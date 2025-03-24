FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install yarn
RUN yarn install  && yarn build
CMD ["yarn", "start"]
