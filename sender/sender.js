const webSocket = new WebSocket("ws://35.154.251.210:9000/")

webSocket.onmessage = (event) => {
    handleSignallingData(JSON.parse(event.data))
}

function handleSignallingData(data) {
    switch (data.type) {
        case "answer":
            peerConn.setRemoteDescription(data.answer)
            break
        case "candidate":
            peerConn.addIceCandidate(data.candidate)
    }
}

let username
function sendUsername() {
    username = document.getElementById("username-input").value
    console.log(username)
    sendData({
        type: "store_user"
    })
}

function sendData(data) {
    data.username = username
    console.log(data)
    webSocket.send(JSON.stringify(data))
}


let localStream
let peerConn
async function startCall() {
    document.getElementById("video-call-div")
        .style.display = "inline"
    // var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }
    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function (constraints) {

            // First get ahold of the legacy getUserMedia, if present
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            // Some browsers just don't implement it - return a rejected promise with an error
            // to keep a consistent interface
            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
            }

            // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
            return new Promise(function (resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    }
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(function (stream) {

            // navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            // navigator.mediaDevices.getUserMedia = function (constraints) {

            //     navigator.getUserMedia(constraints).then((stream) => {
            localStream = stream
            document.getElementById("local-video").srcObject = localStream

            let configuration = {
                iceServers: [
                    {
                        "urls": ["stun:stun.l.google.com:19302",
                            "stun:stun1.l.google.com:19302",
                            "stun:stun2.l.google.com:19302"]
                    }
                ]
            }

            peerConn = new RTCPeerConnection(configuration)
            peerConn.addStream(localStream)

            peerConn.onaddstream = (e) => {
                document.getElementById("remote-video")
                    .srcObject = e.stream
            }

            peerConn.onicecandidate = ((e) => {
                if (e.candidate == null)
                    return
                sendData({
                    type: "store_candidate",
                    candidate: e.candidate
                })
            })

            createAndSendOffer()
            // }, (error) => {
            //     console.log(error)
            // })
            // }

        })
}

function createAndSendOffer() {
    peerConn.createOffer((offer) => {
        sendData({
            type: "store_offer",
            offer: offer
        })

        peerConn.setLocalDescription(offer)
    }, (error) => {
        console.log(error)
    })
}

let isAudio = true
function muteAudio() {
    isAudio = !isAudio
    localStream.getAudioTracks()[0].enabled = isAudio
}

let isVideo = true
function muteVideo() {
    isVideo = !isVideo
    localStream.getVideoTracks()[0].enabled = isVideo
}