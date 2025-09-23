# Usa un'immagine base di Node.js
FROM node:18-alpine
FROM mcr.microsoft.com/playwright:v1.55.1-jammy

# Imposta la directory di lavoro all'interno del container
WORKDIR /Pumpfun

# Copia i file package.json e package-lock.json
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto dei file del progetto
COPY . .

# Espone la porta su cui il server ascolta
EXPOSE 4000

# Comando per avviare l'applicazione
CMD ["node", "index.js"]
