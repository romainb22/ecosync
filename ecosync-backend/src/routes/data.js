/**
 * @swagger
 * tags:
 *   name: Données
 *   description: Mesures simulées protégées par authentification
 */

const express = require("express");
const router = express.Router();
const { generateFakeData } = require("../services/dataService");
const prisma = require("../lib/prisma");
const upload = require("../middlewares/upload");
const authenticateToken = require("../middlewares/auth");

/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Récupérer les mesures enregistrées (filtrable)
 *     tags: [Données]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de début (ex. 2025-07-01T00:00:00Z)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date de fin (ex. 2025-07-03T00:00:00Z)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Nombre maximum de mesures à retourner
 *     responses:
 *       200:
 *         description: Liste des mesures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   timestamp:
 *                     type: string
 *                   temperature:
 *                     type: number
 *                   humidity:
 *                     type: integer
 *                   co2:
 *                     type: integer
 *       401:
 *         description: Authentification requise
 */

// GET : Récupérer les mesures filtrées
router.get("/", async (req, res) => {
    try {
        const { start, end, limit } = req.query;

        const where = {};

        if (start) {
            where.timestamp = { ...where.timestamp, gte: new Date(start) };
        }

        if (end) {
            where.timestamp = { ...where.timestamp, lte: new Date(end) };
        }

        const measurements = await prisma.measurement.findMany({
            where,
            orderBy: { timestamp: "desc" },
            take: limit ? parseInt(limit) : undefined,
        });

        res.json(measurements);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de la récupération des mesures filtrées" });
    }
});


module.exports = router;

/**
 * @swagger
 * /api/data:
 *   post:
 *     summary: Enregistrer une nouvelle mesure
 *     tags: [Données]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [temperature, humidity, co2, sensorName]
 *             properties:
 *               temperature:
 *                 type: number
 *                 example: 23.5
 *               humidity:
 *                 type: integer
 *                 example: 51
 *               co2:
 *                 type: integer
 *                 example: 412
 *               sensorName:
 *                  type: string
 *                  example: "Salon"
 *     responses:
 *       201:
 *         description: Mesure enregistrée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Authentification requise
 */

// POST : Ajouter une mesure
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { temperature, humidity, co2, sensorName } = req.body;

        if (!temperature || !humidity || !co2 || !sensorName) {
            return res.status(400).json({ error: "Il manque un paramètre" });
        }

        const newMeasurement = await prisma.measurement.create({
            data: {
                temperature: parseFloat(temperature),
                humidity: parseInt(humidity),
                co2: parseInt(co2),
                sensorName,
            },
        });

        res.status(201).json(newMeasurement);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

/**
 * @swagger
 * /api/data/import:
 *   post:
 *     summary: Importer un tableau JSON de mesures
 *     tags: [Données]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [timestamp, temperature, humidity, co2, sensorName]
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 temperature:
 *                   type: number
 *                 humidity:
 *                   type: integer
 *                 co2:
 *                   type: integer
 *                 sensorName:
 *                   type: string
 *     responses:
 *       201:
 *         description: Mesures importées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "96 mesures importées"
 *       400:
 *         description: Erreur de validation des données
 *       401:
 *         description: Authentification requise
 */

router.post("/import", authenticateToken, async (req, res) => {
    try {
        const data = req.body.input;

        // Log brut
        console.log("Reçu pour import:", typeof data, Array.isArray(data) ? `${data.length} lignes` : data);

        if (!Array.isArray(data)) {
            console.warn("❌ Données non-valide (pas un tableau)");
            return res.status(400).json({ error: "Données attendues sous forme de tableau" });
        }

        if (data.length === 0) {
            console.warn("⚠️ Données vides");
            return res.status(400).json({ error: "Aucune mesure à importer" });
        }

        // Log un aperçu des premières lignes
        console.log("🔍 Premieres lignes:", data.slice(0, 2));

        const formatted = data.map((row, i) => {
            if (
                !row.timestamp ||
                isNaN(new Date(row.timestamp)) ||
                isNaN(parseFloat(row.temperature)) ||
                isNaN(parseInt(row.humidity)) ||
                isNaN(parseInt(row.co2)) ||
                !row.sensorName
            ) {
                throw new Error(`Ligne ${i + 1} invalide`);
            }

            return {
                timestamp: new Date(row.timestamp),
                temperature: parseFloat(row.temperature),
                humidity: parseInt(row.humidity),
                co2: parseInt(row.co2),
                sensorName: row.sensorName,
            };
        });

        const result = await prisma.measurement.createMany({ data: formatted });

        console.log(`✅ Import réussi : ${formatted.length} lignes`);

        res.status(201).json({
            message: `${formatted.length} mesures importées`,
            importedCount: result.count,
        });
    } catch (err) {
        console.error("❌ Erreur lors de l'import :", err.message);
        res.status(400).json({ error: `Erreur lors de l'import : ${err.message}` });
    }
});

