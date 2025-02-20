const sessionMaterial = document.getElementById("session-materials");
const sessionChat = document.getElementById("session-chat");
const sessionHighlight = document.getElementById("highlight-square");
const contentSession = document.getElementById("session-content");
const sessionStudent = document.getElementById("session-students");
const sessionRequests = document.getElementById("session-requests");

function openNewCalendarEvent() {
    document.getElementById("new-calendar-event").style.display = "block";
    document.getElementById("materials-shared").style.filter = "blur(8px)";
}

function closeNewCalendarEvent() {
    document.getElementById("new-calendar-event").style.display = "none";
    document.getElementById("materials-shared").style.filter = "none";
}

function openDeleteSecAlert(secName) {
    document.getElementById("delete-section-alert").style.display = "block";
    document.getElementById("materials-main").style.filter = "blur(8px)";
    document.getElementById("section-name-delete").value = secName;
}

function closeDeleteSecAlert() {
    document.getElementById("delete-section-alert").style.display = "none";
    document.getElementById("materials-main").style.filter = "none";
}

function openNewSection() {
    const previousSections = document.querySelectorAll(".new-section");
    previousSections.forEach(item => {
        item.style.background = "";
    })
    let sectionContainer = document.getElementById("materials-categories");
    const sectionData = document.getElementById("sectionData");
    const id = sectionData.getAttribute("data-id");
    const studentId = sectionData.getAttribute("data-student-id");

    const div = document.createElement('div');
    div.classList.add("new-section-container");

    const input = document.createElement('input');
    input.placeholder = "Enter section name...";
    input.name = "section";
    input.required = "true";
    input.classList.add('new-section-input');

    const roomInput = document.createElement('input');
    roomInput.type = "hidden";
    roomInput.value = room;
    roomInput.name = "room";

    const submitButton = document.createElement('button');
    submitButton.innerHTML = `<i class="fa-solid fa-check"></i>`;
    submitButton.classList.add("new-section-buttons");
    submitButton.type = "submit";

    const sectionForm = document.createElement("form");
    sectionForm.action = `/newSection/${id}/${studentId}`;
    sectionForm.method = "post";

    const cancelButton = document.createElement('button');
    cancelButton.innerHTML = `<i class="fa-solid fa-x"></i>`;
    cancelButton.classList.add("new-section-buttons");
    cancelButton.addEventListener("click", deleteNewSection);

    sectionForm.appendChild(input);
    sectionForm.appendChild(roomInput);
    sectionForm.appendChild(submitButton);
    div.appendChild(sectionForm);
    div.appendChild(cancelButton);

    sectionContainer.appendChild(div);

    const activatedSection = document.getElementById("section-single");
    if (activatedSection) {
        activatedSection.removeAttribute = "active";
    }
}

function confirmNewSection() {
    let sectionContainer = document.getElementById("materials-categories");
    let name = document.querySelector('.new-section-input');
    let inputField = document.querySelector('.new-section-container')

    const div = document.createElement('div');
    div.classList.add("new-section");
    div.innerHTML = name.value;

    sectionContainer.removeChild(inputField);
    sectionContainer.appendChild(div);
}

function deleteNewSection() {
    let sectionContainer = document.getElementById("materials-categories");
    let inputField = document.querySelector('.new-section-container')
    sectionContainer.removeChild(inputField);
}


sessionMaterial.addEventListener("click", () => {
    sessionHighlight.style.top = "0px";
    contentSession.style.top = "10%";
})

sessionChat.addEventListener("click", () => {
    sessionHighlight.style.top = "50px";
    sessionHighlight.style.height = "50px";
    contentSession.style.top = "-87%";
})

function deleteTutoring() {
    document.getElementById("delete-tutor-alert").style.display = "block";
    document.getElementById("session-content").style.filter = "blur(8px)";
}

function closeDeleteTutoring() {
    document.getElementById("delete-tutor-alert").style.display = "none";
    document.getElementById("session-content").style.filter = "none";
}

document.querySelectorAll(".upload-document").forEach(item => {
    item.addEventListener('click', () => {
        const section = item.dataset.secName;
        document.querySelector('input[name="section"]').value = section;
        document.getElementById("upload-doc-popup").style.display = "block";
        document.getElementById("materials-main").style.filter = "blur(8px)";
    });
});

function closeDocUpload() {
    document.getElementById("upload-doc-popup").style.display = "none";
    document.getElementById("materials-main").style.filter = "none";
}

const activeSections = document.querySelectorAll(".new-section");
const scrollableDiv = document.getElementById("materials-main");
const sections = document.querySelectorAll(".section-single");

let activeDivIndex = null;

const scrollToSection = (index) => {
    const section = sections[index];
    const sectionTop = section.offsetTop;
    const currentScroll = scrollableDiv.scrollTop;

    const scrollAmount = sectionTop - currentScroll;

    const adjustedScrollAmount = scrollAmount - 120 ;

    scrollableDiv.scrollBy({
        top: adjustedScrollAmount,
        behavior: "smooth"
    });
};

activeSections.forEach((item, index) => {
    item.addEventListener('click', () => {
        if (item.classList.contains("deactivated")) {
            return;
        }

        activeSections.forEach((section) => {
            section.style.background = "";
        });

        item.style.background = "#80deea70";

        item.classList.add("deactivated");

        if (activeDivIndex !== null && activeDivIndex !== index) {
            const prevActiveDiv = activeSections[activeDivIndex];
            prevActiveDiv.classList.remove("deactivated");
            prevActiveDiv.style.background = "";
        }

        scrollToSection(index);

        activeDivIndex = index;
    });
});







// const socket = io('http://localhost:3000');
const socket = io('https://www.learnloot.ch/');
// const socket = io('https://b676-2a04-ee41-4-724d-b917-9248-6a61-191f.ngrok-free.app/', {
//     transports: ["websocket", "polling"],
//     withCredentials: true
// });


const tutorId = document.getElementById('tutor-id').value;
const studentId = document.getElementById('student-id').value;
const identityCheck = document.getElementById('identity-check').value;
const room = `${tutorId}-${studentId}`;

document.addEventListener('DOMContentLoaded', () => {
    let messages = document.getElementById("messages");
    messages.scrollTop = messages.scrollHeight;
})

socket.emit('joinRoom', room);

socket.on('previousMessages', (messages) => {
    messages.forEach((msg) => outputMessage(msg));
});

socket.on('fromServer', (newMessage) => {
    outputMessage(newMessage);
    let messages = document.getElementById("messages");
    messages.scrollTop = messages.scrollHeight;
});

socket.on('incomingCallNotification', () => {
    document.querySelector(".shockwave-container").style.display = "block";
    document.getElementById("start-call").style.display = "none";
});

socket.on('removeCallNotification', () => {
    document.querySelector(".shockwave-container").style.display = "none";
    document.getElementById("start-call").style.display = "flex";
});

document.getElementById("messages-form").addEventListener('submit', (e) => {
    e.preventDefault();
    const newMessage = document.getElementById("user-message-input").value;
    document.getElementById("user-message-input").value = "";
    const identity = document.getElementById("identity-name-span").innerHTML;

    socket.emit('chatMessage', { room, text: newMessage, identity });
});

function outputMessage(message) {
    const div = document.createElement('div');
    div.innerHTML = `<p class="message-meta">${message.time}</p>
        <p class="message-text">
            ${message.text}
        </p>`;
    
    if (message.identity == identityCheck) {
        div.classList.add('message-single');
    } else {
        div.classList.add('message-single-own');
    }

    document.getElementById('messages').appendChild(div);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector(".shockwave-container").style.display = "none";
});


const messagesDiv = document.getElementById("messages");
const observer = new MutationObserver(() => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

observer.observe(messagesDiv, { childList: true });

window.addEventListener("load", () => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});


function setNotiOpenCall(tutor, student, id) {
    document.querySelector(".shockwave-container").style.display = "block";
    window.location = `/videocall/${tutor}/${student}/${id}`;
}


