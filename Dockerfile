FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client and build Next.js
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

# Run migrations then start the production server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
