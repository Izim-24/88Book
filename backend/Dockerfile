# Build from the repository root so the backend can import ../shared:
#   docker build -f backend/Dockerfile .
FROM node:20-slim

WORKDIR /app/backend

COPY backend/package*.json ./

# msnodesqlv8 (Windows Authentication only) is optional and may not build on Linux.
RUN npm install

COPY backend/ ./
COPY shared/ /app/shared/

EXPOSE 5000

CMD ["npm", "run", "dev"]
