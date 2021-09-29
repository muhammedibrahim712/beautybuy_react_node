# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:latest

# Create app directory
WORKDIR /opt/beautybuy

# Install app dependencies
COPY package*.json ./
RUN npm install
RUN npm ci --only=production
RUN apt-get -y update
RUN apt-get -y install default-jre

# Bundle app source
COPY . .
RUN npm run build

# Cleanup unused resources
RUN apt-get -y remove default-jre
RUN apt-get -y autoremove

EXPOSE 4000
CMD ["npm", "start"]
