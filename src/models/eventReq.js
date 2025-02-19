const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EventReqSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    eventId: {
        type: String,
        required: true
    }
})

const EventReq = mongoose.model("eventReq", EventReqSchema);
module.exports = EventReq;