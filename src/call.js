const socket = io('http://localhost:3000');
// const socket = io('https://b676-2a04-ee41-4-724d-b917-9248-6a61-191f.ngrok-free.app/', {
//     transports: ["websocket", "polling"],
//     withCredentials: true
// });


const tutorId = document.getElementById('tutor-id').value;
const studentId = document.getElementById('student-id').value;
const eventId = document.getElementById('event-id').value;
const identityCheck = document.getElementById('identity-check').value;
const room = `${tutorId}-${studentId}`;
const muteBtn = document.getElementById("mute-btn");
const cameraBtn = document.getElementById("camera-btn");
const leaveBtn = document.getElementById("leave-btn");



let isMuted = false;
let isCameraOn = true;

muteBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);

    muteBtn.innerHTML = isMuted 
        ? '<i class="fa-solid fa-microphone-slash"></i>' 
        : '<i class="fa-solid fa-microphone"></i>';
});

cameraBtn.addEventListener("click", () => {
    isCameraOn = !isCameraOn;
    localStream.getVideoTracks().forEach(track => track.enabled = isCameraOn);

    cameraBtn.innerHTML = isCameraOn 
        ? '<i class="fa-solid fa-video"></i>' 
        : '<i class="fa-solid fa-video-slash"></i>';
});

leaveBtn.addEventListener("click", () => {
    socket.emit("leaveRoom", room);
    socket.emit("stopCall", room);
    
    localStream.getTracks().forEach(track => track.stop());

    if (peerConnection) {
        peerConnection.close();
    }

    if (identityCheck == tutorId) {
        window.location.href = `/tutor/session/${eventId}/${studentId}`;
    } else {
        window.location.href = `/classes/${eventId}`;
    }
});





let localStream;
let remoteStream;
let peerConnection;

const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

const mainVideo = document.getElementById("main-video");
const smallVideo = document.getElementById("small-video");
const swapBtn = document.getElementById("swap-btn");
const toggleSmallVideoBtn = document.getElementById("toggle-small-video-btn");
const controls = document.querySelector(".controls");

let isSwapped = false;
let isSmallVideoVisible = true;
let mouseTimeout;

swapBtn.addEventListener("click", () => {
    isSwapped = !isSwapped;
    
    const tempStream = mainVideo.srcObject;
    mainVideo.srcObject = smallVideo.srcObject;
    smallVideo.srcObject = tempStream;
});

toggleSmallVideoBtn.addEventListener("click", () => {
    isSmallVideoVisible = !isSmallVideoVisible;

    if (isSmallVideoVisible) {
        smallVideo.style.display = "block";
        toggleSmallVideoBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        smallVideo.style.display = "none";
        toggleSmallVideoBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
});

document.addEventListener("mousemove", () => {
    controls.style.opacity = "1";
    swapBtn.style.opacity = "1";
    toggleSmallVideoBtn.style.opacity = "1";

    clearTimeout(mouseTimeout);
    mouseTimeout = setTimeout(() => {
        controls.style.opacity = "0";
        swapBtn.style.opacity = "0";
        toggleSmallVideoBtn.style.opacity = "0";
    }, 3000);
});

async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    mainVideo.srcObject = localStream;

    socket.emit('joinVideoRoom', room);
    notificationInterval = setInterval(() => {
        socket.emit('startCall', room);
    }, 5000);
}

socket.on('userJoined', async (otherUserId) => {
    peerConnection = new RTCPeerConnection(iceServers);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
        if (!remoteStream) {
            remoteStream = new MediaStream();
        }
        remoteStream.addTrack(event.track);

        smallVideo.srcObject = remoteStream;
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('iceCandidate', { room, candidate: event.candidate });
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { room, offer });
});

socket.on('offer', async ({ offer }) => {
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(iceServers);

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.ontrack = (event) => {
            if (!remoteStream) {
                remoteStream = new MediaStream();
                document.getElementById('small-video').srcObject = remoteStream;
            }
            remoteStream.addTrack(event.track);
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('iceCandidate', { room, candidate: event.candidate });
            }
        };
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit('answer', { room, answer });
});

socket.on('answer', ({ answer }) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('iceCandidate', ({ candidate }) => {
    if (candidate) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

startCall();