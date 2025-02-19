const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SectionSchema = new Schema({
    name: {
        type: String,
        required: false
    },
    files: {
        type: [String],
        required: false
    }
});

const RoomInfoSchema = new Schema({
    room: {
        type: String,
        required: true
    },
    section: [SectionSchema]
});

const Room = mongoose.model("Room", RoomInfoSchema);
module.exports = Room;
