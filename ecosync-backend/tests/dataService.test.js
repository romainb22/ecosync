const { generateFakeData } = require("../src/services/dataService");

describe("generateFakeData", () => {
    it("devrait générer 10 éléments par défaut", () => {
        const result = generateFakeData();
        expect(result).toHaveLength(10);
    });

    it("devrait générer le bon nombre d’éléments", () => {
        const result = generateFakeData(5);
        expect(result).toHaveLength(5);
    });

    it("chaque élément doit avoir temperature, humidity, co2, timestamp", () => {
        const [measure] = generateFakeData(1);
        expect(measure).toHaveProperty("temperature");
        expect(measure).toHaveProperty("humidity");
        expect(measure).toHaveProperty("co2");
        expect(measure).toHaveProperty("timestamp");
    });
});
