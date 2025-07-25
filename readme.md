# EcoSync

Suivi intelligent de la consommation environnementale – Application Fullstack Angular / Node.js

---

## 🚀 Présentation

**EcoSync** est une application web moderne pour le suivi, l’analyse et la visualisation de données de consommation issues de capteurs (température, humidité, CO₂).

Fonctionnalités principales :
- Visualisation graphique et filtrage multi-critères (plages de dates, capteur, seuils…)
- Authentification sécurisée (JWT), gestion des utilisateurs
- Export CSV/ZIP des données et graphiques, import CSV
- Historique des sessions d’analyse
- API RESTful documentée (Swagger)
- UI/UX Material Design responsive

---
<pre lang="markdown">
## 🗂️ Architecture du projet

ecosync/
│
├── backend/                  # Node.js + Express + Prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── lib/
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   └── package.json
│
├── frontend/                 # Angular + Material + ng2-charts
│   ├── src/
│   │   ├── app/
│   │   └── ...
│   ├── angular.json
│   └── package.json
│
├── docker-compose.yml        # Orchestration front + back
├── README.md                 # Documentation globale
└── ...
</pre>

---

## ⚙️ Installation & démarrage rapide

### 1. Prérequis

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- (Optionnel, pour développement local : Node.js 20+, npm 9+)

---

### 2. Cloner le projet

```bash
git clone https://github.com/TON_ORGA/ecosync.git
cd ecosync
3. Configuration des variables d’environnement
Backend (backend/.env)
Crée un fichier .env :

ini
DATABASE_URL="file:./dev.db"        # SQLite pour dev ou postgres pour prod
JWT_SECRET="votre_secret_ici"
Pour PostgreSQL :
DATABASE_URL="postgresql://user:password@host:5432/dbname"

Frontend
Aucune configuration particulière par défaut.
(À adapter selon le besoin d’une URL API custom.)

4. Lancer la stack avec Docker Compose
À la racine du projet :

bash
docker-compose up --build
Frontend : http://localhost:4200

Backend API : http://localhost:3000

Swagger (doc API) : http://localhost:3000/api-docs

5. Commandes utiles en développement (hors Docker)
Lancer le frontend
bash
cd frontend
npm install
ng serve
Lancer le backend

bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev         # Pour initialiser la BDD (SQLite/dev)
npm start
🛠️ Fonctionnalités
Authentification : Inscription, login sécurisé, récupération de mot de passe (JWT)

Tableau de bord : Filtres puissants, graphique dynamique (courbe/barres/radar)

Export CSV/ZIP : Récupération de vos données + visuel du graphe

Import CSV : Import de mesures pour tester ou compléter vos données

Historique : Sessions de génération sauvegardées (replay, export)

API RESTful : Tout le backend exposé, documenté via Swagger

🐳 Docker/Déploiement
Fichier docker-compose.yml exemple

version: "3.9"

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "4200:80"
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend/prisma:/app/prisma
    # command: ["npm", "start"] # Décommenter si besoin

  # db:
  #   image: postgres:16
  #   environment:
  #     POSTGRES_DB: ecosync
  #     POSTGRES_USER: ecosync
  #     POSTGRES_PASSWORD: password
  #   ports:
  #     - "5432:5432"
Build Dockerfile frontend (Angular)
dockerfile

# Étape 1 : build Angular
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : Nginx pour servir le build
FROM nginx:alpine
COPY --from=builder /app/dist/* /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
Build Dockerfile backend (Node/Express)
dockerfile

FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
# CMD ["npm", "start"]
📊 Exemple de jeu de données (CSV supporté)
csv

timestamp,temperature,humidity,co2,sensorName
2025-07-18T17:00:24.414Z,20.1,52,486,Garage
2025-07-18T16:00:24.414Z,23.5,41,364,Garage
...
🧑‍💻 Contribution
Fork et Pull Request bienvenus !

Respecter l’architecture (Angular modulaire, services, code typé)

Tests unitaires recommandés (ng test côté front, jest ou mocha côté back)

Documentation Swagger maintenue à jour (cf. /backend/src/routes/auth.js etc.)

📚 Technologies principales
Angular 17+ (Material, ng2-charts)

Node.js 20+

Express

Prisma ORM (SQLite ou PostgreSQL)

Nginx (pour servir Angular en prod)

Docker (multi-stage + Compose)

Swagger (doc API automatique)

🤝 Contact & Infos
Auteur : Bruno ROMAIN

Prêt à démarrer ?
→ Lance docker-compose up --build et surveille ta conso !