const express = require("express");

const http = require("http");

const { Server } = require("socket.io");

const fs = require("fs");

const app = express();

const server =
    http.createServer(app);

const io =
    new Server(server);

// PASSWORD

const CHAT_PASSWORD =
    "998899";

// MIDDLEWARE

app.use(express.json({
    limit:"20mb"
}));

app.use(
    express.static("public")
);

// PORT

const PORT =
    process.env.PORT || 3000;

// MESSAGE FILE

const MESSAGE_FILE =
    "messages.json";

// CREATE FILE

if (
    !fs.existsSync(MESSAGE_FILE)
) {

    fs.writeFileSync(
        MESSAGE_FILE,
        "[]"
    );

}

// LOAD MESSAGES

let messages =
    JSON.parse(
        fs.readFileSync(MESSAGE_FILE)
    );

// USERS

let users = {};

// INDIA TIME

function getIndianTime() {

    return new Date()
    .toLocaleTimeString(
        "en-IN",
        {
            timeZone:
                "Asia/Kolkata",

            hour:"2-digit",

            minute:"2-digit"
        }
    );

}

// LOGIN SECURITY

app.post(
    "/login",
    (req,res) => {

        if (
            req.body.password
            ===
            CHAT_PASSWORD
        ) {

            return res.json({
                success:true
            });

        }

        res.json({
            success:false
        });

    }
);

// SOCKET

io.on(
    "connection",
    (socket) => {

        // LOAD HISTORY

        socket.emit(
            "loadHistory",
            messages
        );

        // JOIN

        socket.on(
            "join",
            (username) => {

                users[socket.id] = {

                    name: username,

                    status: "Online"

                };

                io.emit(
                    "onlineUsers",
                    Object.values(users)
                );

            }
        );

        // TYPING

        socket.on(
            "typing",
            (name) => {

                socket.broadcast.emit(
                    "typing",
                    name
                );

            }
        );

        // SEND MESSAGE

        socket.on(
            "sendMessage",
            (data) => {

                const newMessage = {

                    ...data,

                    time:getIndianTime()

                };

                messages.push(
                    newMessage
                );

                fs.writeFileSync(
                    MESSAGE_FILE,

                    JSON.stringify(
                        messages,
                        null,
                        2
                    )
                );

                io.emit(
                    "receiveMessage",
                    newMessage
                );

            }
        );

        // DELETE MESSAGE

        socket.on(
            "deleteMessage",
            (id) => {

                messages =
                    messages.filter(
                        msg =>
                        msg.id !== id
                    );

                fs.writeFileSync(
                    MESSAGE_FILE,

                    JSON.stringify(
                        messages,
                        null,
                        2
                    )
                );

                io.emit(
                    "deleteMessage",
                    id
                );

            }
        );

        // DISCONNECT

        socket.on(
            "disconnect",
            () => {

                if (
                    users[socket.id]
                ) {

                    users[socket.id].status =

                        "Last Seen " +

                        getIndianTime();

                    io.emit(
                        "onlineUsers",

                        Object.values(users)
                    );

                }

            }
        );

    }
);

// START SERVER

server.listen(
    PORT,
    () => {

        console.log(
            "Server Running On Port " + PORT
        );

    }
);