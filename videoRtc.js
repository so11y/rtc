const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};
let pc1;
let pc2;

const ws = new WebSocket("ws://localhost:3000");

ws.addEventListener("message", async (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "join") {
    await pc2.setRemoteDescription(new RTCSessionDescription(data.description));
    if (pc2.remoteDescription.type == "offer") {
      const v = await pc2.createAnswer(configuration);
      await pc2.setLocalDescription(v);
      ws.send(
        JSON.stringify({
          type: "answer",
          description: pc2.localDescription,
        })
      );
    }
  } else if (data.type === "answer") {
    await pc1.setRemoteDescription(new RTCSessionDescription(data.description));
  } else if (data.type === "candidate") {
    console.log("1q23");
    let pc = pc1 || pc2;
    await pc.addIceCandidate(data.candidate);
  }
});

const v = window.prompt("请输入房间号:");

document.addEventListener("DOMContentLoaded", () => {
  if (!v) {
    pc1Handle();
  } else {
    pc2Handle();
  }
});

async function pc1Handle() {
  pc1 = new RTCPeerConnection(configuration);
  window.dataChannel = pc1.createDataChannel("chat");
  dataChannel.onopen = (event) => {
    dataChannel.send("Hi you!");
  };
  // const video = document.getElementById("video");
  // const stream = await navigator.mediaDevices.getDisplayMedia({
  //   video: true,
  //   audio: true,
  // });
  // video.srcObject = stream;
  // video.play();
  // stream.getTracks().forEach((track) => pc1.addTrack(track, stream));
  // pc1.addEventListener("icecandidate", (event) => {
  //   if (event.candidate) {
  //     ws.send(
  //       JSON.stringify({
  //         type: "candidate",
  //         candidate: event.candidate,
  //       })
  //     );
  //   }
  // });
  const offer = await pc1.createOffer({
    // offerToReceiveAudio: true,
    // offerToReceiveVideo: true,
  });
  await pc1.setLocalDescription(offer);
  ws.send(
    JSON.stringify({
      type: "create",
      description: pc1.localDescription,
    })
  );
}

function pc2Handle() {
  pc2 = new RTCPeerConnection(configuration);
  pc2.addEventListener("icecandidate", (event) => {
    if (event.candidate) {
      ws.send(
        JSON.stringify({
          type: "candidate",
          candidate: event.candidate,
        })
      );
    }
  });
  pc2.ontrack = (event) => {
    const remoteStream = event.streams[0]; // 获取远程视频流
    const remoteVideo = document.getElementById("video");
    console.log(remoteStream, "d-d-");
    remoteVideo.autoplay = true; // 自动播放
    remoteVideo.muted = true; // 可选，若需要静音则设置为true
    remoteVideo.playsInline = true; // 针对移动设备，允许内联播放
    remoteVideo.srcObject = remoteStream; // 显示远程视频流’

    document.querySelector("button").addEventListener("click", () => {
      remoteVideo.play();
    });

    remoteVideo.addEventListener("error", function (errorEvent) {
      console.error("An error occurred with the remote video:", errorEvent);
    });
  };
  pc2.ondatachannel = (event) => {
    const channel = event.channel;
    // channel.onopen = (event) => {
    //   channel.send("Hi back!");
    // };
    channel.onmessage = (event) => {
      console.log(event.data);
    };
  };
  ws.addEventListener("open", () => {
    ws.send(
      JSON.stringify({
        type: "join",
      })
    );
  });
}
