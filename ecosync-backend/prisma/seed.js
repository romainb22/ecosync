const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const sensors = ["Salon", "Cuisine", "Garage", "Chambre"];
    const now = new Date();
    const data = [];

    for (let h = 0; h < 24; h++) {
        for (let sensor of sensors) {
            data.push({
                timestamp: new Date(now.getTime() - h * 3600 * 1000),
                temperature: parseFloat((20 + Math.random() * 5).toFixed(1)),
                humidity: Math.floor(40 + Math.random() * 20),
                co2: Math.floor(300 + Math.random() * 200),
                sensorName: sensor,
            });
        }
    }

    await prisma.measurement.createMany({ data });
    console.log("Jeu de données inséré avec succès !");
}

main()
.then(() => prisma.$disconnect())
 .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
