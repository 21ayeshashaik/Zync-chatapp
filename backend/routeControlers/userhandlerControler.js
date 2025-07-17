import Conversation from "../Models/conversionModels.js";
import User from "../Models/userModels.js";

export const getUserBySearch = async(req, res) => {
    try {
        const search = req.query.search || '';
        const currentUserID = req.user._id;
        
        // Improved search query
        const user = await User.find({
            $and: [
                {
                    $or: [
                        { username: { $regex: search, $options: 'i' } },
                        { fullname: { $regex: search, $options: 'i' } }
                    ]
                },
                { _id: { $ne: currentUserID } }
            ]
        }).select("-password");

        console.log(`Search query "${search}" found ${user.length} users`);
        
        res.status(200).json(user);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}


export const getCurrentChatters = async (req, res) => {
    try {
        const currentUserID = req.user._id;

        const conversations = await Conversation.find({
            participants: currentUserID
        }).sort({ updatedAt: -1 });

        if (!conversations.length) return res.status(200).json([]);

        const participantIds = new Set();

        conversations.forEach(convo => {
            convo.participants.forEach(id => {
                if (id.toString() !== currentUserID.toString()) {
                    participantIds.add(id.toString());
                }
            });
        });

        const users = await User.find({
            _id: { $in: Array.from(participantIds) }
        }).select('-password');

        res.status(200).json(users);
    } catch (error) {
        console.error("Get chatters error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

