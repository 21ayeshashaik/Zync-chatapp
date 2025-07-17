import mongoose from "mongoose"

const messageSchema = mongoose.Schema({
    senderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reciverId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message:{
        type: String,
        required: function() {
            return this.messageType === 'text';
        }
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'voice'],
        default: 'text'
    },
    fileUrl: {
        type: String,
        required: function() {
            return this.messageType === 'image' || this.messageType === 'voice';
        }
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    duration: {
        type: Number // For voice messages in seconds
    }
}, {timestamps: true})

const Message = mongoose.model("Message", messageSchema)

export default Message;
