// Envoyer une demande d'ami
const sendFriendRequest = async (req, res) => {
  const prisma = req.prisma;
  const senderId = req.user?.id;
  const { receiverId } = req.body;

  if (!prisma) return res.status(500).json({ error: "Prisma non injecté" });
  if (!senderId || !receiverId) return res.status(400).json({ message: "Champs requis manquants" });
  if (senderId === receiverId) {
    return res.status(400).json({ message: "Impossible de s’ajouter soi-même." });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      senderId,
      receiverId,
      status: "PENDING",
    },
  });

  if (existing) {
    return res.status(400).json({ message: "Demande déjà envoyée ou existante." });
  }

  const request = await prisma.friendship.create({
    data: {
      senderId,
      receiverId,
      status: "PENDING",
    },
  });

  res.status(201).json(request);
};

// Accepter une demande d'ami
const acceptFriendRequest = async (req, res) => {
  const prisma = req.prisma;
  const receiverId = req.user?.id;
  const { senderId } = req.body;

  if (!prisma) return res.status(500).json({ error: "Prisma non injecté" });
  if (!senderId || !receiverId) return res.status(400).json({ message: "Champs requis manquants" });

  const updated = await prisma.friendship.updateMany({
    where: {
      senderId,
      receiverId,
      status: "PENDING",
    },
    data: { status: "ACCEPTED" },
  });

  if (updated.count === 0) {
    return res.status(404).json({ message: "Demande introuvable." });
  }

  res.json({ message: "Ami accepté." });
};

// Refuser une demande d'ami
const rejectFriendRequest = async (req, res) => {
  const prisma = req.prisma;
  const receiverId = req.user?.id;
  const { senderId } = req.body;

  if (!prisma) return res.status(500).json({ error: "Prisma non injecté" });
  if (!senderId || !receiverId) return res.status(400).json({ message: "Champs requis manquants" });

  const updated = await prisma.friendship.updateMany({
    where: {
      senderId,
      receiverId,
      status: "PENDING",
    },
    data: { status: "REJECTED" },
  });

  if (updated.count === 0) {
    return res.status(404).json({ message: "Demande introuvable." });
  }

  res.json({ message: "Demande rejetée." });
};

// Lister les amis
const listFriends = async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user?.id;

  if (!prisma) return res.status(500).json({ error: "Prisma non injecté" });
  if (!userId) return res.status(400).json({ message: "Utilisateur non authentifié." });

  const friends = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: userId, status: "ACCEPTED" },
        { receiverId: userId, status: "ACCEPTED" },
      ],
    },
    include: {
      sender: true,
      receiver: true,
    },
  });

  const formatted = friends.map(f => {
    const isSender = f.senderId === userId;
    const friend = isSender ? f.receiver : f.sender;
    return {
      id: friend.id,
      email: friend.email,
    };
  });

  res.json(formatted);
};

// Lister les demandes reçues
const listFriendRequests = async (req, res) => {
  const prisma = req.prisma;
  const userId = req.user?.id;

  if (!prisma) return res.status(500).json({ error: "Prisma non injecté" });
  if (!userId) return res.status(400).json({ message: "Utilisateur non authentifié." });

  const requests = await prisma.friendship.findMany({
    where: {
      receiverId: userId,
      status: "PENDING",
    },
    include: {
      sender: true,
    },
  });

  res.json(requests.map(r => ({
    id: r.senderId, // Pour l'UI, tu veux l'id du sender pour accepter/refuser
    sender: {
      id: r.sender.id,
      email: r.sender.email,
    },
  })));
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  listFriends,
  listFriendRequests,
};
