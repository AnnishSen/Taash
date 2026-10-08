import prisma from "../lib/prisma.js";
import { isOnline as isSocketOnline } from "../socket/socketManager.js";
// send friend request function
export const sendFriendRequest = async (req, res) => {
    const senderId = req.user.userId;
    const { username } = req.body;
    // check if this user exost in database or not 
    if (!username) {
        return res.status(400).json({
            success: false,
            message: "username is required",
        });
    }
    // check if receiver exist or not 
    const receiver = await prisma.user.findUnique({
        where: {
            username,
        },
    });
    if (!receiver) {
        return res.status(404).json({
            success: false,
            message: "user not found",
        });
    }
    // if receiver and sender are same or not 
    if (receiver.id === senderId) {
        return res.status(400).json({
            success: false,
            message: "you cannot add yourself",
        });
    } // backend ban rha hai
    //if friend ship already exist or not 
    const existingFriendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                {
                    user1Id: senderId,
                    user2Id: receiver.id,
                },
                {
                    user1Id: receiver.id,
                    user2Id: senderId,
                },
            ]
        },
    });
    if (existingFriendship) {
        return res.status(400).json({
            success: false,
            message: `you are already friend with ${receiver.username}`,
        });
    }
    // check if friend request already sent or not
    const existingRequest = await prisma.friendRequest.findFirst({
        where: {
            OR: [
                {
                    senderId: senderId,
                    receiverId: receiver.id,
                    status: "PENDING",
                },
                {
                    senderId: receiver.id,
                    receiverId: senderId,
                    status: "PENDING",
                },
            ],
        },
    });
    if (existingRequest) {
        return res.status(400).json({
            success: false,
            message: "friend request already exist",
        });
    }
    // if we reach here it mean now we c an sent friend request
    await prisma.friendRequest.create({
        data: {
            senderId: senderId,
            receiverId: receiver.id,
        },
    });
    return res.status(201).json({
        success: true,
        message: `Friend request sent to ${receiver.username}`,
    });
};
// get pending requests
export const getPendingRequests = async (req, res) => {
    const userId = req.user.userId;
    const requests = await prisma.friendRequest.findMany({
        where: {
            receiverId: userId,
            status: "PENDING",
        },
        include: {
            sender: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    isOnline: true,
                },
            },
        }
    });
    return res.status(200).json({
        success: true,
        requests,
    });
};
export const acceptFriendRequest = async (req, res) => {
    const userId = req.user.userId; // loged in user 
    const { requestId } = req.body; // Which request is being accepted?
    // validate input 
    if (!requestId) {
        return res.status(400).json({
            success: false,
            message: "Request ID is required",
        });
    }
    const request = await prisma.friendRequest.findUnique({
        where: {
            id: requestId,
        },
    });
    if (!request) {
        return res.status(404).json({
            success: false,
            message: "Friend request not found",
        });
    }
    if (request.receiverId !== userId) {
        return res.status(403).json({
            success: false,
            message: "You are not authorized",
        });
    }
    if (request.status !== "PENDING") {
        return res.status(400).json({
            success: false,
            message: "friend request is no longer pending",
        });
    }
    await prisma.$transaction(async (tx) => {
        await tx.friendRequest.update({
            where: {
                id: requestId,
            },
            data: {
                status: "ACCEPTED",
            },
        });
        await tx.friendship.create({
            data: {
                user1Id: request.senderId,
                user2Id: request.receiverId,
            },
        });
    });
    return res.status(200).json({
        success: true,
        message: "Friend request accepted",
    });
};
// get friends
export const getFriends = async (req, res) => {
    const userId = req.user.userId;
    const friends = await prisma.friendship.findMany({
        where: {
            OR: [
                {
                    user1Id: userId,
                },
                {
                    user2Id: userId,
                },
            ],
        },
        include: {
            user1: true,
            user2: true,
        },
    });
    const friendsList = friends.map((friendship) => {
        const friend = friendship.user1.id === userId
            ? friendship.user2
            : friendship.user1;
        return {
            id: friend.id,
            username: friend.username,
            isOnline: isSocketOnline(friend.id) || friend.isOnline,
        };
    });
    return res.status(200).json({
        success: true,
        friends: friendsList,
    });
};
// reject request
export const rejectFriendRequest = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { requestId } = req.body;
        // Validate input
        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: "Request ID is required",
            });
        }
        // Find the friend request
        const request = await prisma.friendRequest.findUnique({
            where: {
                id: requestId,
            },
        });
        // Check if request exists
        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found",
            });
        }
        // Authorization: only the receiver can reject
        if (request.receiverId !== userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to reject this request",
            });
        }
        // Check request status
        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Friend request is no longer pending",
            });
        }
        // Update status
        await prisma.friendRequest.update({
            where: {
                id: requestId,
            },
            data: {
                status: "REJECTED",
            },
        });
        return res.status(200).json({
            success: true,
            message: "Friend request rejected",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export const removeFriend = async (req, res) => {
    const userId = req.user.userId;
    const friendId = req.params.friendId; // taken as string to tell the tuype script that it will alsways be string
    if (!friendId) {
        return res.status(400).json({
            success: false,
            message: " friend id is required",
        });
    }
    const friendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                {
                    user1Id: userId,
                    user2Id: friendId,
                },
                {
                    user1Id: friendId,
                    user2Id: userId,
                },
            ],
        },
    });
    if (!friendship) {
        return res.status(404).json({
            success: false,
            message: "Friendship not found",
        });
    }
    await prisma.friendship.delete({
        where: {
            id: friendship.id,
        },
    });
    return res.status(200).json({
        success: true,
        message: "Friend deleted",
    });
};
//# sourceMappingURL=friendsController.js.map