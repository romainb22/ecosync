const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require("../middlewares/auth");
const { listMessages } = require("../controllers/messages.controller");

// --- CONFIG UPLOAD ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        cb(null, base + '-' + Date.now() + ext);
    }
});
const upload = multer({ storage });

// --- ROUTES STATIQUES D'ABORD ! ---

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Gestion des messages privés, notifications, fichiers joints
 */

/**
 * @swagger
 * /messages/unread-count:
 *   get:
 *     summary: Nombre de messages non lus pour l'utilisateur courant
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de messages non lus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       500:
 *         description: Erreur serveur
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const count = await req.prisma.message.count({
            where: {
                receiverId: userId,
                isRead: false
            }
        });
        res.json({ count });
    } catch (err) {
        console.error('Erreur unread-count:', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/**
 * @swagger
 * /messages/mark-read:
 *   post:
 *     summary: Marquer comme lus les messages reçus d'un ami
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [friendId]
 *             properties:
 *               friendId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nombre de messages mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updated:
 *                   type: integer
 *       400:
 *         description: Champ manquant
 *       500:
 *         description: Erreur serveur
 */
// POST /messages/mark-read
router.post('/mark-read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { friendId } = req.body;
        if (!friendId) return res.status(400).json({ error: "Champ friendId requis" });

        const result = await req.prisma.message.updateMany({
            where: {
                senderId: friendId,
                receiverId: userId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ updated: result.count });
    } catch (err) {
        console.error('Erreur mark-read:', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


/**
 * @swagger
 * /messages/last:
 *   get:
 *     summary: Derniers messages reçus (notifications)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre maximum de messages à retourner (max 20, défaut 5)
 *     responses:
 *       200:
 *         description: Liste des messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       500:
 *         description: Erreur serveur
 */
// GET /messages/last : derniers messages reçus (pour notifications)
router.get('/last', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        let limitRaw = Number(req.query.limit);
        let limit = (!isNaN(limitRaw) && limitRaw > 0) ? Math.min(limitRaw, 20) : 5;
        const messages = await req.prisma.message.findMany({
            where: { receiverId: userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                sender: { select: { id: true, email: true } }
            }
        });
        const formatted = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            senderEmail: msg.sender.email,
            createdAt: msg.createdAt,
            fileUrl: msg.fileUrl,
            fileType: msg.fileType
        }));
        res.json(formatted);
    } catch (err) {
        console.error('Erreur last-messages:', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/**
 * @swagger
 * /messages/upload:
 *   post:
 *     summary: Uploader un fichier joint à un message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Infos sur le fichier uploadé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileUrl:
 *                   type: string
 *                 fileType:
 *                   type: string
 *       400:
 *         description: Aucun fichier reçu
 *       500:
 *         description: Erreur serveur
 */
// POST /messages/upload (UPLOAD DE FICHIER)
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu" });
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ fileUrl, fileType: req.file.mimetype });
});

// --- ROUTES DYNAMIQUES EN DERNIER ---

/**
 * @swagger
 * /messages/{friendId}:
 *   get:
 *     summary: Récupérer les messages avec un ami
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Liste des messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       500:
 *         description: Erreur serveur
 */
// Récupérer les messages avec un ami
router.get("/:friendId", authenticateToken, listMessages);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Envoyer un message à un ami
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId]
 *             properties:
 *               receiverId:
 *                 type: string
 *               content:
 *                 type: string
 *               fileUrl:
 *                 type: string
 *               fileType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Message vide
 *       500:
 *         description: Erreur serveur
 */
// Envoyer un message
router.post("/", authenticateToken, async (req, res) => {
    const prisma = req.prisma;
    const userId = req.user.id;
    const { receiverId, content, fileUrl, fileType } = req.body;

    if ((!content || !content.trim()) && !fileUrl) {
        return res.status(400).json({ error: "Message vide" });
    }

    // Optionnel: sécurité amis...

    const message = await prisma.message.create({
        data: {
            senderId: userId,
            receiverId,
            content,
            fileUrl,
            fileType
        }
    });
    res.status(201).json(message);
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         content:
 *           type: string
 *         senderId:
 *           type: string
 *         senderEmail:
 *           type: string
 *         receiverId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         fileUrl:
 *           type: string
 *         fileType:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = router;
