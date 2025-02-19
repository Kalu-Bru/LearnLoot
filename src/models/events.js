const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventSchema = new Schema({
    subject: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    tutor: {
        type: String,
        required: true
    },
    students: {
        type: [String],
        required: false
    }
})

const Event = mongoose.model("event", EventSchema);
module.exports = Event;