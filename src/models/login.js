const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new mongoose.Schema({
    eventId: { 
        type: String,
        required: false
    },
    studentId: {
        type: String,
        required: false
    },
    title: {
        type: String,
        required: false
    },
    start: {
        type: String,
        required: false
    },
    end: {
        type: String,
        required: false
    },
    tutoring: {
        type: Boolean,
        required: false
    }
});

const LoginSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phonenumber: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true
    },
    webtoken: {
        type: String,
        required: false
    },
    walletAddress: {
        type: String,
        required: false,
        default: null
    },
    classes: {
        type: [String],
        required: false
    },
    sessions: [sessionSchema]
});

const User = mongoose.model("user_data", LoginSchema);
module.exports = User;