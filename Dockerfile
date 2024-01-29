# Use an official Node.js runtime as a parent image
FROM node:16.13.2-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to /app
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to /app
COPY . .

# Expose the port the app will listen on
EXPOSE 3000

# Define the command to start the app
CMD ["npm", "start"]
