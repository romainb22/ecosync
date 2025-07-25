const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "secret";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Token requis" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.warn("[AUTH] Token invalide ou expiré :", err.message);
            return res.status(403).json({ error: "Token invalide ou expiré" });
        }
        console.log("[🧪 DEBUG TOKEN] Payload du token décodé :", user);
        req.user = user; // place le payload du token dans req.user
        next();
    });
}

module.exports = authenticateToken;
