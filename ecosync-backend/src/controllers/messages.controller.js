const listMessages = async (req, res) => {
    const prisma = req.prisma;
    const userId = req.user.id;
    const friendId = Number(req.params.friendId);

    if (!friendId || isNaN(friendId)) {
        return res.status(400).json({ error: "Paramètre friendId manquant ou invalide" });
    }

    // Sécurité: n'afficher QUE si users sont amis!
    const areFriends = await prisma.friendship.findFirst({
        where: {
            OR: [
                { senderId: userId, receiverId: friendId, status: "ACCEPTED" },
                { senderId: friendId, receiverId: userId, status: "ACCEPTED" },
            ]
        }
    });
    if (!areFriends) return res.status(403).json({ error: "Pas amis !" });

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId, receiverId: friendId },
                { senderId: friendId, receiverId: userId }
            ]
        },
        orderBy: { createdAt: "asc" }
    });
    res.json(messages);
};

const sendMessage = async (req, res) => {
    const prisma = req.prisma;
    const userId = req.user.id;
    const { receiverId, content } = req.body;

    if (!content?.trim() || !receiverId) return res.status(400).json({ error: "Message ou destinataire manquant." });

    // Sécurité: vérifier qu'ils sont amis
    const areFriends = await prisma.friendship.findFirst({
        where: {
            OR: [
                { senderId: userId, receiverId, status: "ACCEPTED" },
                { senderId: receiverId, receiverId: userId, status: "ACCEPTED" },
            ]
        }
    });
    if (!areFriends) return res.status(403).json({ error: "Pas amis !" });

    const message = await prisma.message.create({
        data: {
            senderId: userId,
            receiverId,
            content,
        }
    });
    res.status(201).json(message);
};

module.exports = { listMessages, sendMessage };
