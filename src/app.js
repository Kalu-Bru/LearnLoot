const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const bcrypt = require('bcryptjs');
const http = require("http");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secret = crypto.randomBytes(64).toString('hex');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const formatMessage = require("./utils/messages.js");
const multer = require("multer");
const { MongoClient, GridFSBucket } = require("mongodb");
const fs = require("fs");
const cors = require("cors");
const dotenv = require('dotenv');
dotenv.config();

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
    .then((result) => console.log("Connected to db"))
    .catch((err) => console.log(err));

const conn = mongoose.connection;

let gfs, gridFSBucket;

conn.once("open", () => {
    console.log("Connected to MongoDB");

    gridFSBucket = new GridFSBucket(conn.db, {
        bucketName: "uploads",
    });

    console.log("GridFS Initialized");
});

const storage = multer.memoryStorage();
const upload = multer({ storage });


const Event = require("./models/events");
const User = require("./models/login");
const EventReq = require("./models/eventReq");
const Message = require("./models/messages");
const Room = require("./models/sections");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors()); 

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST;

const expressServer = app.listen(PORT, HOST, () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
});

const socketio = require("socket.io");
const io = socketio(expressServer, {
    // cors: {
    //     origin: "https://b676-2a04-ee41-4-724d-b917-9248-6a61-191f.ngrok-free.app",
    //     methods: ["GET", "POST"]
    // }
}) 

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname)));
app.use("/images", express.static(path.join(__dirname, "src/images")));

app.use(cookieParser());

app.use(session({
    secret: secret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

const JWT_SECRET = secret;
const authenticateToken = (req, res, next) => {
    const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

    if (!token) return res.redirect('/login');

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        next();
    });
};


////////////////////////////////////////////////////////////////
////////                                                ////////
////////                                                ////////
////////                     GET                        ////////
////////                                                ////////
////////                                                ////////
////////////////////////////////////////////////////////////////

app.get('/', (req, res) => {
    res.redirect('/home');
})

app.get('/registration', (req, res) => {
    res.render('registration');
})

app.get('/login', (req, res) => {
    res.render('login');
})

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/home');
        }
        res.clearCookie('connect.sid'); 
        res.redirect('/');
    });
});

app.get('/home', authenticateToken, (req, res) => {
    const id = req.user.username;

    User.findOne({ username: id })
        .then(result => {
            res.render('index2', { sessions: result.sessions });
        })
        .catch(err => {
            console.log(err);
        })
})

app.get('/marketplace', authenticateToken, (req, res) => {
    res.render('marketplace');
})

app.get('/schedule', authenticateToken, async (req, res) => {
    try {
        const id = req.user.username;
        const user = await User.findOne({ username: id }).lean();

        if (!user) {
            return res.status(404).send('User not found');
        }

        const events = user.sessions.map(session => ({
            title: session.title,
            start: session.start,
            end: session.end,
            url: session.tutoring 
                ? `/tutoring/session/${session.eventId}/${session.studentId}`
                : `/classes/${session.eventId}`
        }));

        res.render('schedule', { events });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving user data');
    }
});


app.get('/tutor', authenticateToken, (req, res) => {
    Event.find({})
        .then(result => {
            res.render('tutor', { events: result });
        })
})

app.get('/tutor/session/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const eventreq = await EventReq.find({ eventId: id });

    Event.findById(id)
        .then(result => {
            res.render('sessions-dashboard', { event: result, id: id, eventReq: eventreq });
        })
    
})

app.get('/tutor/session/:id/:studentId', authenticateToken, (req, res) => {
    const id = req.params.id;
    const student = req.params.studentId;
    const username = req.user.username;

    Event.findById(id)
        .then(async (result) => {
            const roomInfo = await Room.findOne({ room: `${result.tutor}-${student}`});
            res.render('session', { event: result, id: id, studentId: student, username: username, room: roomInfo });
        })
    
})

app.get("/videocall/:tutor/:student/:id", authenticateToken, (req, res) => {
    const tutorId = req.params.tutor;
    const studentId = req.params.student;
    const eventId = req.params.id;
    const username = req.user.username;

    res.render('videocall', { tutorId: tutorId, studentId: studentId, eventId: eventId, username: username });
});

app.get('/classes', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    Event.find({ _id: { $in: user.classes } })
        .then(result => {
            res.render('classes', { events: result});
        })
});

app.get('/classes/search', authenticateToken, (req, res) => {
    Event.find({})
        .then(result => {
            res.render('classes-search', { events: result });
        })
});

app.get('/classes/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const username = req.user.username;

    Event.findById(id)
        .then(result => {
            res.render('class-single', { event: result, id: id, studentId: result.students.indexOf(username), username: username });
        })
});

app.get('/file/:filename', async (req, res) => {
    const file = gridFSBucket.openDownloadStreamByName(req.params.filename);
    file.pipe(res);
});




////////////////////////////////////////////////////////////////
////////                                                ////////
////////                                                ////////
////////                     POST                       ////////
////////                                                ////////
////////                                                ////////
////////////////////////////////////////////////////////////////


app.post("/registration", async (req, res) => {
    const data = {
        fullname: req.body.fullname,
        username: req.body.username,
        email: req.body.email,
        phonenumber: req.body.phonenumber,
        password: req.body.password,
    };

    try {
        const existingUser = await User.findOne({ username: data.username });
        if (existingUser) {
            res.render("/registration", { title: "Registration", errorMessage: "User already exists. Please choose a different username." });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        data.password = hashedPassword;

        const userdata = await User.insertMany(data);
        console.log(userdata);

        res.render("login", { title: 'Login' , errorMessage: null });
    } catch (error) {
        res.status(500).send("Error registering user");
    }
});

app.post("/login", async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) {
            return res.render("login", { title: "Login", errorMessage: "User does not exist" });
        }

        const isPasswordMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isPasswordMatch) {
            return res.render("login", { title: "Login", errorMessage: "Wrong username or password" });
        }

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: "1H" });

        res.cookie("token", token, { httpOnly: true, secure: false });      //process.env.NODE_ENV === "production"
        
        await User.updateOne({username: req.body.username}, {$set: { webtoken: token }});

        res.redirect('/home');
    } catch (error) {
        res.status(500).render("login", { title: "Login", errorMessage: "Error during login" });
        console.log(error);
    }
});


app.post('/tutoring', async (req, res) => {
    console.log(req.body);
    var eventData = {
        subject: req.body.subject,
        language: req.body.language,
        level: req.body.level,
        price: req.body.price,
        tutor: "Kalu"
    }

    const eventsv = new Event(eventData);

    const existingEvents = await Event.findOne({ subject: eventsv.subject, language: eventsv.language, level: eventsv.level, tutor: eventsv.tutor });
    if(existingEvents) {
        res.send("This session already exists. Create a new one or access the session through your tutor dashboard.");
    } else {
        eventsv.save()
            .then((result) => {
                console.log(eventsv);
                res.redirect("/tutor"); 
            });
    }
})

app.post('/classes', (req, res) => {
    Event.find({ subject: req.body.subject, language: req.body.language, level: req.body.level })
        .then(result => {
            res.render('classes-search', { events: result })
        })
})

app.post('/classes/reset', (req, res) => {
    res.redirect('/classes-search');
})

app.post('/classes/search', authenticateToken, async (req, res) => {
    const username = req.user.username;
    const id = req.body.event;

    try {
        const newReq = new EventReq({
            username: username,
            eventId: id
        });
        await newReq.save();
        res.redirect('/classes');
    } catch (err) {
        console.log(err);
    }
})

app.post('/request/reject/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    const requestId = req.body.requestId;

    EventReq.findByIdAndDelete(requestId)
        .then(result => {
            res.redirect(`/tutor/session/${id}`);
        })
})

app.post('/request/accept/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    const requestId = req.body.requestId;
    const username = req.body.username;

    await EventReq.findByIdAndDelete(requestId);

    await User.findOneAndUpdate({ username: username }, { $push: { classes: id }});

    await Event.findByIdAndUpdate(id, { $push: { students: username }}, { new: true });

    try {
        const event = await Event.findById(id);
        const room = `${event.tutor}-${event.students.indexOf(username)}`
        const isRoom = await Room.findOne({ room: room });

        if (!isRoom) {
            await Room.create({
                room: room,
                section: []
            });
        }

        res.redirect(`/tutor/session/${id}`);

    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
})

app.post('/newEvent', async (req, res) => {
    const id = req.body.eventId;
    const student = req.body.student;
    const event = await Event.findById(id);

    const newSessionStudent = {
        eventId: id,
        studentId: event.students.indexOf(student),
        title: event.subject,
        start: req.body.start,
        end: req.body.end,
        tutoring: false
    }

    const newSessionTutor = {
        eventId: id,
        studentId: event.students.indexOf(student),
        title: event.subject,
        start: req.body.start,
        end: req.body.end,
        tutoring: true
    }

    await User.findOneAndUpdate({ username: student }, { $push: { sessions: newSessionStudent }});

    User.findOneAndUpdate({ username: tutor }, { $push: { sessions: newSessionTutor }})
        .then(result => {
            res.redirect('/schedule');
        })
})

app.post('/newSection/:id/:studentId', async (req, res) => {
    const room = req.body.room;
    const section = req.body.section;
    const id = req.params.id;
    const studentId = req.params.studentId;

    try {
        const isRoom = await Room.findOne({ room: room });

        if (!isRoom) {
            await Room.create({
                room: room,
                section: [{ name: section }]
            });
        } else {
            await Room.findOneAndUpdate(
                { room: isRoom.room },
                { $push: { section: { name: section, files: [] } } }
            );
        }

        res.redirect(`/tutor/session/${id}/${studentId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

app.post("/upload-document", upload.single("fileDoc"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Received File:", req.file);

    const originalName = req.body.title; // Example filename
    const safeOriginalName = path.basename(originalName, path.extname(originalName)).replace(/\s+/g, "_");
    const filename = `${safeOriginalName}_${crypto.randomBytes(8).toString("hex")}${path.extname(originalName)}`;

    const uploadStream = gridFSBucket.openUploadStream(filename);
    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", async () => {
        console.log(`File ${filename} uploaded successfully`);

        const tutor = req.body.tutor;
        const id = req.body.eventId;
        const student = req.body.student;
        const sectionName = req.body.section;
        const room = `${tutor}-${student}`;

        await Room.findOneAndUpdate(
            { room: room, "section.name": sectionName },
            { $push: { "section.$.files": filename } },
            { new: true }
        );

        res.redirect(`/tutor/session/${id}/${student}`);
    });

    uploadStream.on("error", (err) => {
        console.error("Upload Error:", err);
        res.status(500).json({ error: "File upload failed" });
    });
});




////////////////////////////////////////////////////////////////
////////                                                ////////
////////                                                ////////
////////                     DELETE                     ////////
////////                                                ////////
////////                                                ////////
////////////////////////////////////////////////////////////////

app.post('/tutor/session/:id', (req, res) => {
    const id = req.params.id;

    Event.findByIdAndDelete(id)
        .then(result => {
            res.redirect('/tutor')
        })
        .catch(err => {
            console.log(err);
        })
})


app.post('/tutor/session/:id/:student', async (req, res) => {
    const id = req.params.id;
    const student = req.params.student;

    await Event.findByIdAndUpdate(id, { $pull: { students: student } })

    User.findOneAndUpdate({ username: student }, { $pull : { classes: id } })
        .then(result =>{
            res.redirect(`/tutor/session/${id}`);
        })
        .catch(err => {
            console.log(err);
        })

})

app.post('/delete-section/:tutor/:student/:id', async (req, res) => {
    const id = req.params.id;
    const student = req.params.student;
    const tutor = req.params.tutor;
    const room = `${tutor}-${student}`;
    const section = req.body.section;
    console.log(section);

    Room.findOneAndUpdate({ room: room}, { $pull: { section: { name: section }}})
        .then(result => {
            res.redirect(`/tutor/session/${id}/${student}`);
        })
        .catch(err => {
            console.log(err);
        })

})





////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//                                                              SOCKET




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


io.on('connection', (socket) => {
    socket.on('joinRoom', async (room) => {
        socket.join(room);
        
        const messages = await Message.find({ room }).sort({ _id: 1 });
        socket.emit('previousMessages', messages);
    });

    socket.on('chatMessage', async ({ room, text, identity }) => {
        const formattedMessage = formatMessage(text, identity);
        
        const newMessage = new Message({
            room,
            text: formattedMessage.text,
            identity: formattedMessage.identity,
            time: formattedMessage.time
        });
        await newMessage.save();

        io.to(room).emit('fromServer', formattedMessage);
    });
});

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('joinVideoRoom', (room) => {
        socket.join(room);
        socket.to(room).emit('userJoined', socket.id);
    });

    socket.on('startCall', (room) => {
        socket.to(room).emit('incomingCallNotification');
    });

    socket.on('stopCall', (room) => {
        socket.to(room).emit('removeCallNotification');
    });

    socket.on('offer', ({ room, offer }) => {
        socket.to(room).emit('offer', { offer });
    });

    socket.on('answer', ({ room, answer }) => {
        socket.to(room).emit('answer', { answer });
    });

    socket.on('iceCandidate', ({ room, candidate }) => {
        socket.to(room).emit('iceCandidate', { candidate });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});


