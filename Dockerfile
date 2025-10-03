# Use a lightweight official Node.js image
FROM node:18-alpine 

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port (must match the PORT in .env)
EXPOSE 3000

# The default command to run when the container starts (overridden by docker-compose)
CMD ["npm", "start"]
