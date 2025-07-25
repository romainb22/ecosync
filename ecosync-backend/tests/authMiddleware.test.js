const authenticateToken = require("../src/middlewares/auth");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

describe("Middleware authenticateToken", () => {
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
    };
    const next = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("devrait refuser une requête sans header Authorization", () => {
        const req = { headers: {} };
        authenticateToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Token requis" });
    });

    it("devrait refuser un token invalide", () => {
        const req = {
            headers: { authorization: "Bearer tokenbidon" },
        };
        authenticateToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ error: "Token invalide ou expiré" });
    });

    it("devrait autoriser une requête avec token valide", () => {
        const token = jwt.sign({ id: 1, email: "test@x.com" }, JWT_SECRET, {
            expiresIn: "1h",
        });
        const req = {
            headers: { authorization: `Bearer ${token}` },
        };

        authenticateToken(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
