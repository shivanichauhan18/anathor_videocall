const Socket = require("websocket").server
const http = require("http")
const express = require('express');
const app = express();
const server = http.createServer(app)
const path = require("path")
const multer = require('multer');
const cloudinary = require('cloudinary').v2
const mongoose = require('mongoose');

cloudinary.config({
    cloud_name: 'comrade1',
    api_key: '559756786776347',
    api_secret: 'Te_1WF3Tpv95PHNJ5ybVYdpqV4o'
})
const login_type = require("./login")
app.use(express.static(__dirname + '/sender'));

var upload = multer({
    storage: multer.diskStorage({
    })
})


console.log("outside io");
//DB url
DB_CONNECTION = "mongodb+srv://deepakdevelopersveltose01:pass@123@comrade.8vvxj.mongodb.net/ComradeUser?retryWrites=true&w=majority"
//connect to DB
mongoose.Promise = global.Promise;
mongoose.connect(DB_CONNECTION, {
    useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true,
    useFindAndModify: false
}, () => {
    console.log('Connected to DB!');
});


app.post("/login_app", upload.single('profile_pic'), async (req, res) => {
    const { email, id, name, login_types } = req.body
    const response = await cloudinary.uploader.upload(req.file.path)
    const data1 = new login_type({
        email: email,
        fb_id: id,
        name: name,
        login_types: login_types,
        profile_pic: response.url

    })
    data1.id = data1._id
    data1.save()
        .then((resp) => {
            res.json({ code: 200, msg: resp })
        }).catch((err) => {
            res.json({ code: 400, msg: "something went wrong" })
        })

})

app.get("/sender_call", (req, res) => {
    res.sendFile(
        path.join(__dirname + '/sender/sender.html')
    )
}
)
app.get("/recieve_call", (req, res) => {
    res.sendFile(
        path.join(__dirname + '/receiver/receiver.html')
    )
}
)




server.listen(9000, () => {
    console.log("Listening on port 9000...")
})



const webSocket = new Socket({ httpServer: server })

let users = []

webSocket.on('request', (req) => {
    const connection = req.accept()

    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)

        const user = findUser(data.username)

        switch (data.type) {
            case "store_user":

                if (user != null) {
                    return
                }

                const newUser = {
                    conn: connection,
                    username: data.username
                }

                users.push(newUser)
                console.log(newUser.username)
                break
            case "store_offer":
                if (user == null)
                    return
                user.offer = data.offer
                break

            case "store_candidate":
                if (user == null) {
                    return
                }
                if (user.candidates == null)
                    user.candidates = []

                user.candidates.push(data.candidate)
                break
            case "send_answer":
                if (user == null) {
                    return
                }

                sendData({
                    type: "answer",
                    answer: data.answer
                }, user.conn)
                break
            case "send_candidate":
                if (user == null) {
                    return
                }

                sendData({
                    type: "candidate",
                    candidate: data.candidate
                }, user.conn)
                break
            case "join_call":
                if (user == null) {
                    return
                }

                sendData({
                    type: "offer",
                    offer: user.offer
                }, connection)

                user.candidates.forEach(candidate => {
                    sendData({
                        type: "candidate",
                        candidate: candidate
                    }, connection)
                })

                break
        }
    })

    connection.on('close', (reason, description) => {
        users.forEach(user => {
            if (user.conn == connection) {
                users.splice(users.indexOf(user), 1)
                return
            }
        })
    })
})

function sendData(data, conn) {
    conn.send(JSON.stringify(data))
}

function findUser(username) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].username == username)
            return users[i]
    }
}