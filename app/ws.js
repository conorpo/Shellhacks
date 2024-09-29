const { WebSocketServer } = require("ws");

let audioBuffer = [];

const { setup_recognize_stream } = require("../model/stt.js"); 

function setup_call_listener(port) {
  const wss = new WebSocketServer({ port: port });

  console.log("WebSocket server hosted on port", port);

  wss.on("connection", (ws) => {
    const recognize_stream = setup_recognize_stream();


    ws.on("message", (message) => {
      let data;

      try {
        data = JSON.parse(message);
      } catch (e) {
        console.log("Invalid message format");
        return;
      }

      if (data.event === "media" && data.media) {
        //console.log(Object.keys(data.media), Object.keys(data));
        const audioChunk = Buffer.from(data.media.payload, 'base64');

        audioBuffer.push(audioChunk);

        if (audioBuffer.length > 50) {
          const combinedChunk = Buffer.concat(audioBuffer);
          console.log(combinedChunk.byteLength);
          recognize_stream.write(combinedChunk);

          audioBuffer = [];
        }
      }

      if (data.event === "stop") {
        console.log("Call stopped, closing speaker");
        recognize_stream.end();
        ws.close();
      }
    });

    ws.on("close", () => {
      console.log("Connection closed");
    });
  });
}

module.exports = { setup_call_listener }