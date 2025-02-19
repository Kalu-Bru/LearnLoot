const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    room: String,
    text: String,
    identity: String,
    time: String
});

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message;