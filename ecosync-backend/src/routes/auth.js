/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Routes d'authentification pour accéder à l’API
 */

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const TOKEN_EXPIRE_TIME = "1h"; // durée configurable

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d’un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@ecosync.local
 *               password:
 *                 type: string
 *                 example: SuperSecure123
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Erreur lors de l'inscription
 */
// REGISTER
router.post("/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashed },
        });

        res.status(201).json({ message: "Utilisateur créé" });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Erreur lors de l'inscription" });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion de l'utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@ecosync.local
 *               password:
 *                 type: string
 *                 example: SuperSecure123
 *     responses:
 *       200:
 *         description: Connexion réussie, retourne un token JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Identifiants invalides
 *       500:
 *         description: Erreur serveur
 */


// LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Identifiants invalides" });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRE_TIME }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Récupère la liste des utilisateurs (temporaire)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   email:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Erreur serveur
 */
// TEMP : Liste tous les utilisateurs (à supprimer en prod)
router.get("/users", async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des utilisateurs" });
    }
});

/**
 * @swagger
 * /auth/check-email:
 *   post:
 *     summary: Vérifie si l’email existe déjà
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@ecosync.local
 *     responses:
 *       200:
 *         description: Retourne si l’email existe ou non
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 */
router.post("/check-email", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email requis" });
    }
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        res.json({ exists: !!user });
    } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Demande une réinitialisation du mot de passe
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@ecosync.local
 *     responses:
 *       200:
 *         description: L’email de réinitialisation a été envoyé (si l’email existe)
 *       400:
 *         description: Erreur de requête
 *       500:
 *         description: Erreur serveur
 */
router.post('/reset-password', async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: "Email requis" });
    }
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Toujours retourner OK pour ne pas leak si l'email existe
            return res.json({ message: "Si un compte existe pour cet e-mail, un message a été envoyé." });
        }

        // Générer un token temporaire (reset)
        const resetToken = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Stocker ce token (en bdd ou mémoire selon le vrai besoin)
        // await prisma.user.update({ where: { id: user.id }, data: { resetToken } });

        // Envoyer le mail ici (ou juste logguer pour la démo)
        console.log(`Token de reset (à envoyer par mail): http://localhost:4200/reset-password/${resetToken}`);

        // Toujours retourner le même message
        res.json({ message: "Si un compte existe pour cet e-mail, un message a été envoyé." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

module.exports = router;
