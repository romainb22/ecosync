const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path"); // Manquait !
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = require("./lib/prisma");

// Middlewares
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));
app.use(express.json());

// Injection Prisma dans req
app.use((req, res, next) => {
    req.prisma = prisma;
    next();
});

// Logger simple
app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.originalUrl}`);
    next();
});

// Fichiers statiques pour les uploads (important !)
// À utiliser pour permettre l’accès aux fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes de base
app.get("/", (req, res) => {
    res.send("Bienvenue sur EcoSync API 🌱");
});

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const authenticateToken = require("./middlewares/auth");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Auth & API routes
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const dataRoute = require("./routes/data");
app.use("/api/data", authenticateToken, dataRoute);

const friendsRoutes = require("./routes/friends");
app.use("/friends", authenticateToken, friendsRoutes);

const messagesRoutes = require("./routes/messages");
app.use("/messages", messagesRoutes);

// Lancer le serveur
app.listen(port, () => {
    console.log(`EcoSync backend lancé sur http://localhost:${port}`);
});
