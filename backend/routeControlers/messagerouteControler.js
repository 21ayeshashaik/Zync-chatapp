import Conversation from "../Models/conversionModels.js";
import Message from "../Models/messageSchema.js";
import { getReciverSocketId, io } from "../Socket/socket.js";
import mongoose from "mongoose";

export const sendMessage = async (req, res) => {
    try {
        console.log('Send message request received');
        console.log('Body:', req.body);
        console.log('File:', req.file);
        console.log('Params:', req.params);

        const { messages, messageType, duration } = req.body;
        const { id: reciverId } = req.params;
        const senderId = req.user._id;
        const file = req.file;

        if (!mongoose.Types.ObjectId.isValid(reciverId)) {
            console.error('Invalid receiver ID:', reciverId);
            return res.status(400).json({ error: "Invalid receiver ID" });
        }

        const msgType = messageType || 'text';
        console.log('Final resolved Message type:', msgType);

        if (msgType === 'text' && (!messages || !messages.trim())) {
            console.error('Validation failed: Message content required for text message');
            return res.status(400).json({ error: "Message content required" });
        }

        if ((msgType === 'image' || msgType === 'voice') && !file) {
            console.error('Validation failed: File required for message type:', msgType);
            return res.status(400).json({ error: `File required for ${msgType} message` });
        }

        if (file) {
            console.log('File Mimetype:', file.mimetype);
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, reciverId] }
        });

        if (!conversation) {
            console.log('No conversation found, creating new one');
            conversation = await Conversation.create({
                participants: [senderId, reciverId],
                messages: []
            });
        }

        const messageData = {
            senderId: senderId,
            reciverId: reciverId,
            conversationId: conversation._id,
            messageType: msgType
        };

        if (msgType === 'text') {
            messageData.message = messages.trim();
        } else if (file) {
            let subfolder = '';
            if (file.mimetype.startsWith('image/')) subfolder = 'images/';
            else if (file.mimetype.startsWith('audio/')) subfolder = 'voice/';

            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${subfolder}${file.filename}`;
            console.log('Constructed file URL:', fileUrl);

            messageData.fileUrl = fileUrl;
            messageData.fileName = file.originalname;
            messageData.fileSize = file.size;

            if (msgType === 'voice' && duration) {
                const parsedDuration = parseInt(duration);
                messageData.duration = isNaN(parsedDuration) ? 0 : parsedDuration;
                console.log('Voice duration:', messageData.duration);
            }

            messageData.message = msgType === 'voice' ? 'Voice message' : 'Image';
        }

        console.log('Saving message with data:', messageData);
        const newMessage = new Message(messageData);
        const savedMessage = await newMessage.save();

        conversation.messages.push(savedMessage._id);
        await conversation.save();

        const populatedMessage = await Message.findById(savedMessage._id)
            .populate('senderId', 'username fullname profilepic')
            .populate('reciverId', 'username fullname profilepic');

        const receiverSocketId = getReciverSocketId(reciverId.toString());
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", populatedMessage);
        }

        res.status(201).json(populatedMessage);

    } catch (error) {
        console.error("Send message error:", error);
        res.status(500).json({
            error: "Failed to send message",
            details: error.message
        });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: reciverId } = req.params;
        const senderId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(reciverId)) {
            return res.status(400).json({ error: "Invalid receiver ID" });
        }

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, reciverId] }
        }).populate({
            path: 'messages',
            populate: {
                path: 'senderId reciverId',
                select: 'username fullname profilepic'
            }
        });

        if (!conversation) {
            return res.status(200).json([]);
        }

        res.status(200).json(conversation.messages);

    } catch (error) {
        console.error("Get messages error:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};
