const configuration = {
  // iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const socket = useSocket();

document.addEventListener("DOMContentLoaded", () => {
  const owen = window.prompt("");
  if (!owen) {
    pc1Handle();
  } else {
    pc2Handle();
  }
});

async function pc1Handle() {
  await socket.ready;
  const pc1 = crateRtcPeer("create");
  window.dataChannel = pc1.createDataChannel("chat");
  window.dataChannel.onopen = (event) => {
    console.log("Send channel state is: " + dataChannel.readyState);
    window.dataChannel.send("Hi you!", event);
  };
  window.dataChannel.onmessage = (event) => {
    console.log(event.data, "(new message)");
  };
  const offer = await pc1.createOffer();

  await pc1.setLocalDescription(offer);

  await socket.asyncSend({
    type: "offer",
    description: offer,
    pass: true,
  });
  const remoteDescription = await socket.asyncSend({
    type: "remoteDescription",
  });
  await pc1.setRemoteDescription(remoteDescription);

  socket.asyncPass({
    type: "remoteCandidate",
  });
}

async function pc2Handle() {
  await socket.ready;
  const pc = crateRtcPeer("join");
  pc.ondatachannel = (event) => {
    const channel = event.channel;
    window.dataChannel = channel;
    channel.onmessage = (event) => {
      console.log(event.data);
    };
  };
  const offer = await socket.asyncSend({
    type: "join",
  });
  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await socket.asyncPass({
    type: "localDescription",
    description: pc.localDescription,
    pass: true,
  });

  socket.asyncPass({
    type: "remoteCandidate",
  });
}

function crateRtcPeer() {
  const pc = new RTCPeerConnection(configuration);
  const ices = [];

  socket.ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "remoteCandidate") {
      socket.asyncPass({
        type: "localCandidate",
        ices,
      });
    } else if (data.type === "localCandidate") {
      data.ices.forEach((ice) => {
        pc.addIceCandidate(ice);
      });
    }
  });

  pc.addEventListener("icecandidate", (event) => {
    console.log(event, "--_");
    if (event.candidate) {
      ices.push(event.candidate);
    }

    // if (event.candidate) {
    //   socket.asyncPass({
    //     type: "candidate",
    //     name,
    //     candidate: event.candidate,
    //   });
    // }
  });
  return pc;
}

// const configuration = {
//   // iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
// };
// const pc1 = crateRtcPeer();
// const pc2 = crateRtcPeer();

// pc1.addEventListener("icecandidate", (event) => {
//   console.log(event, "d-d-");
//   // pc2.addIceCandidate(event.candidate);
// });
// pc2.addEventListener("icecandidate", (event) => {
//   // pc1.addIceCandidate(event.candidate);
// });
// document.addEventListener("DOMContentLoaded", () => {
//   pc1Handle();
// });

// async function pc1Handle() {
//   window.dataChannel = pc1.createDataChannel("chat");
//   window.dataChannel.onopen = (event) => {
//     console.log("Send channel state is: " + dataChannel.readyState);
//   };
//   const offer = await pc1.createOffer();
//   await pc1.setLocalDescription(offer);

//   // await pc2Handle(offer);
// }

// async function pc2Handle(offer) {
//   pc2.ondatachannel = (event) => {
//     const channel = event.channel;
//     channel.onmessage = (event) => {
//       console.log(event.data);
//     };
//   };
//   await pc2.setRemoteDescription(offer);
//   const answer = await pc2.createAnswer();
//   await pc2.setLocalDescription(answer);

//   await pc1.setRemoteDescription(pc2.localDescription);

//   return pc2;
// }

// function crateRtcPeer() {
//   const pc = new RTCPeerConnection(configuration);
//   return pc;
// }
