# Alpine Linux base image
FROM node:14-alpine

# Set the cwd to the project root
WORKDIR /usr/app

# Copy package.json to the current container
COPY ./package.json ./package.json

# Get all required npm packages
RUN npm install

# Copy everything else
COPY ./index.js ./index.js

# Set the start command for the server
CMD ["npm", "start"]