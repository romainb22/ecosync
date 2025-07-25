const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");
const authenticateToken = require("../src/middlewares/auth");
const prisma = require("../src/lib/prisma");

// Simule une app Express minimale
const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Simule la route protégée
app.post("/api/data", authenticateToken, async (req, res) => {
    const { temperature, humidity, co2 } = req.body;

    try {
        const measure = await prisma.measurement.create({
            data: {
                temperature: parseFloat(temperature),
                humidity: parseInt(humidity),
                co2: parseInt(co2),
            },
        });
        res.status(201).json(measure);
    } catch (e) {
        res.status(500).json({ error: "Erreur insertion" });
    }
});

describe("POST /api/data (route protégée)", () => {
    it("refuse sans token", async () => {
        const res = await request(app)
        .post("/api/data")
         .send({ temperature: 22.5, humidity: 45, co2: 400 });

        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error", "Token requis");
    });

    it("accepte avec token valide", async () => {
        const token = jwt.sign({ id: 1, email: "admin@eco.com" }, JWT_SECRET, {
            expiresIn: "1h",
        });

        const res = await request(app)
        .post("/api/data")
         .set("Authorization", `Bearer ${token}`)
         .send({ temperature: 22.5, humidity: 45, co2: 400 });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("temperature");
        expect(res.body).toHaveProperty("humidity");
        expect(res.body).toHaveProperty("co2");
    });
});
