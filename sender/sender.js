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
    // let stream = null;
    // navigator.getUserMedia = (
    //     navigator.getUserMedia ||
    //     navigator.webkitGetUserMedia ||
    //     navigator.mozGetUserMedia ||
    //     navigator.msGetUserMedia
    // );
    // if (navigator.mediaDevices.getUserMedia == undefined) {
    var constraints = { audio: false, video: true };

    navigator.getUserMedia(constraints).then((stream) => {
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