# Use Node LTS as base
FROM node:20

# Set working directory
WORKDIR /app

# Copy only what's needed first for layer caching
COPY package*.json ./

# Install deps
RUN npm install

# Copy the rest of the app
COPY . .

# Build the TypeScript app
RUN npm run build

# Set entrypoint
CMD ["npm", "run", "observe"]
