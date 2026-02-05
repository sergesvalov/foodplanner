FROM mcr.microsoft.com/playwright:v1.42.1-focal

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

# Run tests by default
CMD ["npm", "test"]
