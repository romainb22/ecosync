function generateFakeData(count = 10) {
    const data = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const timestamp = new Date(now.getTime() - i * 3600000); // chaque heure en arrière

        data.unshift({
            timestamp: timestamp.toISOString(),
            temperature: (20 + Math.random() * 5).toFixed(1), // entre 20 et 25°C
            humidity: Math.floor(40 + Math.random() * 20),     // entre 40 et 60%
            co2: Math.floor(300 + Math.random() * 200),         // entre 300 et 500 ppm
        });
    }

    return data;
}

module.exports = {
    generateFakeData,
};
