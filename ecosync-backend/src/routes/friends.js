/**
 * @swagger
 * tags:
 *   name: Amis
 *   description: Gestion des relations entre utilisateurs (ajout, acceptation, liste)
 */

const express = require("express");
const router = express.Router();
const {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    listFriends,
    listFriendRequests
} = require("../controllers/friends.controller");

/**
 * @swagger
 * /friends/request:
 *   post:
 *     summary: Envoyer une demande d’ami
 *     tags: [Amis]
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
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Demande envoyée avec succès
 *       400:
 *         description: Demande invalide ou existante
 *       401:
 *         description: Authentification requise
 */
router.post("/request", sendFriendRequest);

/**
 * @swagger
 * /friends/accept:
 *   post:
 *     summary: Accepter une demande d’ami
 *     tags: [Amis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [senderId]
 *             properties:
 *               senderId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Demande acceptée
 *       404:
 *         description: Demande introuvable
 *       401:
 *         description: Authentification requise
 */
router.post("/accept", acceptFriendRequest);

/**
 * @swagger
 * /friends/reject:
 *   post:
 *     summary: Refuser une demande d’ami
 *     tags: [Amis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [senderId]
 *             properties:
 *               senderId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Demande rejetée
 *       404:
 *         description: Demande introuvable
 *       401:
 *         description: Authentification requise
 */
router.post("/reject", rejectFriendRequest);

/**
 * @swagger
 * /friends/list:
 *   get:
 *     summary: Lister les amis de l’utilisateur connecté
 *     tags: [Amis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des amis
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
 *       401:
 *         description: Authentification requise
 */
router.get("/list", listFriends);

/**
 * @swagger
 * /friends/requests:
 *   get:
 *     summary: Lister les demandes d’amis reçues
 *     tags: [Amis]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des demandes reçues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   sender:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *       401:
 *         description: Authentification requise
 */
router.get("/requests", listFriendRequests);

/**
 * @swagger
 * /friends/search:
 *   get:
 *     summary: Rechercher des utilisateurs pour les ajouter en amis
 *     tags: [Amis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: "Terme de recherche (ex : début d'email)"
 *     responses:
 *       200:
 *         description: Liste d'utilisateurs correspondant à la recherche
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
 *       401:
 *         description: Authentification requise
 */
router.get("/search", async (req, res) => {
    if (!req.user || !req.user.id) {
        console.warn("[⚠️ SEARCH] Requête sans utilisateur authentifié");
        return res.status(401).json({ error: "Authentification requise" });
    }

    const prisma = req.prisma;
    const currentUserId = req.user.id;
    const { q } = req.query;

    console.log("[🔍 SEARCH] Requête reçue de user ID:", currentUserId);
    console.log("[🔍 SEARCH] Paramètre q:", q);

    if (!q || typeof q !== "string" || q.trim().length < 1) {
        console.warn("[⚠️ SEARCH] Paramètre 'q' manquant ou vide");
        return res.status(400).json({ error: "Requête de recherche invalide" });
    }

    try {
        const relations = await prisma.friendship.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId },
                ],
                status: { in: ["PENDING", "ACCEPTED"] }
            },
            select: {
                senderId: true,
                receiverId: true
            }
        });

        const excludedIds = new Set([currentUserId]);
        for (const r of relations) {
            excludedIds.add(r.senderId);
            excludedIds.add(r.receiverId);
        }

        const excludedArray = Array.from(excludedIds).filter(id => typeof id === 'number');

        const users = await prisma.user.findMany({
            where: {
                email: {
                    contains: q.toLowerCase()
                },
                id: {
                    notIn: excludedArray
                }
            },
            select: {
                id: true,
                email: true
            },
            take: 10
        });

        console.log("[✅ RESULT] Utilisateurs trouvés :", users);
        return res.status(200).json(users); // ✅ La SEULE réponse envoyée
    } catch (err) {
        console.error("❌ ERREUR dans /search :", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});



module.exports = router;
