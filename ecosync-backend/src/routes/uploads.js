const multer = require('multer');
const path = require('path');
const upload = multer({
    dest: path.join(__dirname, '../uploads'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10Mo max
});

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Upload de fichiers générique (hors messagerie)
 */

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload d’un fichier
 *     tags: [Upload]
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
 *         description: Fichier uploadé avec succès
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
 *         description: Aucun fichier envoyé
 *       401:
 *         description: Authentification requise
 */
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' });

    // Stocker les infos dans le message si besoin, ici on retourne juste le lien
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;

    res.json({ fileUrl, fileType });
});
