const socket = io();

// ===== LOGIN =====

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        (e) => {

            e.preventDefault();

            const username =
                document
                .getElementById("nameInput")
                .value
                .trim();

            const password =
                document
                .getElementById("passwordInput")
                .value;

            const errorBox =
                document
                .getElementById("errorBox");

            // EMPTY NAME

            if (username === "") {

                errorBox.innerText =
                    "Enter Name";

                return;
            }

            // LOGIN CHECK

            fetch("/login", {

                method:"POST",

                headers:{
                    "Content-Type":
                    "application/json"
                },

                body:JSON.stringify({
                    password
                })

            })

            .then(res => res.json())

            .then(data => {

                if (!data.success) {

                    errorBox.innerText =
                        "Wrong Password";

                    return;

                }

                localStorage.setItem(
                    "chat_username",
                    username
                );

                window.location.href =
                    "message.html";

            });

        }
    );

}

// ===== CHAT PAGE =====

if (
    window.location.pathname.includes(
        "message.html"
    )
) {

    const myName =
        localStorage.getItem(
            "chat_username"
        );

    if (!myName) {

        window.location.href =
            "login.html";

    }

    socket.emit(
        "join",
        myName
    );

    const chatArea =
        document.getElementById(
            "chatArea"
        );

    const msgInput =
        document.getElementById(
            "msgInput"
        );

    const sendBtn =
        document.getElementById(
            "sendBtn"
        );

    const imageInput =
        document.getElementById(
            "imageInput"
        );

    // LOAD HISTORY

    socket.on(
        "loadHistory",
        (messages) => {

            chatArea.innerHTML = "";

            messages.forEach(msg => {

                renderMessage(msg);

            });

        }
    );

    // RECEIVE MESSAGE

    socket.on(
        "receiveMessage",
        (data) => {

            renderMessage(data);

        }
    );

    // DELETE MESSAGE

    socket.on(
        "deleteMessage",
        (id) => {

            const el =
                document.getElementById(id);

            if (el) {

                el.remove();

            }

        }
    );

    // ONLINE USERS + LAST SEEN

    socket.on(
        "onlineUsers",
        (users) => {

            const onlineBox =
                document.getElementById(
                    "onlineBox"
                );

            let text = "";

            users.forEach(user => {

                text +=
                    `${user.name} (${user.status})\n`;

            });

            onlineBox.innerText = text;

        }
    );

    // TYPING

    msgInput.addEventListener(
        "input",
        () => {

            socket.emit(
                "typing",
                myName
            );

        }
    );

    socket.on(
        "typing",
        (name) => {

            if (name === myName)
                return;

            const typingBox =
                document.getElementById(
                    "typingBox"
                );

            typingBox.innerText =
                name + " is typing...";

            clearTimeout(
                window.typingTimeout
            );

            window.typingTimeout =
                setTimeout(() => {

                    typingBox.innerText =
                        "";

                }, 2000);

        }
    );

    // SEND BUTTON

    sendBtn.onclick =
        sendMessage;

    // ENTER SEND

    msgInput.addEventListener(
        "keypress",
        (e) => {

            if (
                e.key === "Enter"
                &&
                !e.shiftKey
            ) {

                e.preventDefault();

                sendMessage();

            }

        }
    );

    // SEND FUNCTION

    function sendMessage() {

        if (
            msgInput.value.trim()
            === ""
        ) return;

        socket.emit(
            "sendMessage",
            {
                senderName:
                    myName,

                text:
                    msgInput.value,

                image:"",

                id:
                    Date.now()
                    .toString()
            }
        );

        msgInput.value = "";

    }

    // IMAGE SEND

    imageInput.addEventListener(
        "change",
        () => {

            const file =
                imageInput.files[0];

            if (!file)
                return;

            const reader =
                new FileReader();

            reader.onload = () => {

                socket.emit(
                    "sendMessage",
                    {
                        senderName:
                            myName,

                        text:"",

                        image:
                            reader.result,

                        id:
                            Date.now()
                            .toString()
                    }
                );

            };

            reader.readAsDataURL(file);

        }
    );

    // RENDER MESSAGE

    function renderMessage(data) {

        const isMe =
            data.senderName === myName;

        const div =
            document.createElement("div");

        div.className =
            `chat-message ${
                isMe
                ? "sent"
                : "received"
            }`;

        div.id = data.id;

        div.innerHTML = `

            <div class="name">
                ${data.senderName}
            </div>

            ${
                data.text
                ? data.text
                : ""
            }

            ${
                data.image
                ?
                `<img
                    src="${data.image}"
                    class="chat-image"
                >`
                :
                ""
            }

            <div class="time">
                ${data.time}
            </div>

            ${
                isMe
                ?
                `<button
                    class="delete-btn"
                    onclick="deleteMessage('${data.id}')"
                >
                    Delete
                </button>`
                :
                ""
            }

        `;

        chatArea.appendChild(div);

        chatArea.scrollTop =
            chatArea.scrollHeight;

    }

}

// DELETE FUNCTION

function deleteMessage(id) {

    socket.emit(
        "deleteMessage",
        id
    );

}