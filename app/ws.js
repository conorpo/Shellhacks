const { WebSocketServer } = require("ws");
require("dotenv").config();

let audioBuffer = [];

const { active_calls } = require("./call_manager.js"); 
const { setup_recognize_stream } = require("../model/stt.js"); 
const { generateResponse } = require("../model/text_generation.js");
const { analyzeAndStoreCallData } = require('./crm.js');



function setup_call_listener(port) {
  const wss = new WebSocketServer({ port: port });

  console.log("WebSocket server hosted on port", port);

  wss.on("connection", (ws) => {
    let recognize_stream;
    let talking = false;

    ws.on("message", (message) => {
      let data;
      // let connection;

      try {
        data = JSON.parse(message);
      } catch (e) {
        console.log("Invalid message format");
        return;
      }

      if (data.event === "start" && data.start) {
        const call_sid = data.start.callSid;
        const stream_sid = data.start.streamSid;
        console.log(stream_sid);

        recognize_stream = setup_recognize_stream(async (client_response) => {
          console.log("GETTING RESPONSE FOR:", call_sid, client_response);

          let call_object = active_calls[call_sid];
          if (!call_object) console.log("No active call with that sid");


          call_object.message_history.push({
            role: 'user', content: client_response
          });

          console.log(client_response, talking);
          if(!talking) {
            const {ai_response, speechStream} = await generateResponse(call_object.business, call_object.message_history);
            console.log("AI RESPONSE", ai_response);
  
            call_object.message_history.push({
              role: 'assistant', content: ai_response
            })
  
            //Send Message
            speechStream.on("data", (data) => {
              send_message(ws, stream_sid, data);
            });
            
            talking = true;
            setTimeout(() => {
              talking = false;
            },ai_response.length * 50);
          }
        });
    
      }

      if (data.event === "media" && data.media) {
        //console.log(Object.keys(data.media), Object.keys(data));
        const audioChunk = Buffer.from(data.media.payload, 'base64');

        audioBuffer.push(audioChunk);

        if (audioBuffer.length > 50) {
          const combinedChunk = Buffer.concat(audioBuffer);
          recognize_stream.write(combinedChunk);

          audioBuffer = [];
        }
      }

      if (data.event === "stop") {
        const call_object = active_calls[data.stop.callSid];

        const message_history = call_object.message_history;
        const business = call_object.business;
        const phone_number = call_object.phone_number;

        console.log("Call stopped, closing speaker");
        recognize_stream.end();
        ws.close();

        // Analyze and store call data
        analyzeAndStoreCallData(message_history, business.companyName, phone_number)
          .then(customerInfo => {
            console.log('Call analysis completed and stored:', customerInfo);
          })
          .catch(error => {
            console.error('Error analyzing call:', error);
          });
      }
    });

    ws.on("close", () => {
      console.log("Connection closed");
    });
  });
}

function send_message(ws, streamSid, audioFile) {
  const message = {
    event: "media",
    streamSid,
    media: {
      payload: audioFile.toString('base64'),
    },
  };

  ws.send(JSON.stringify(message));
}

module.exports = { setup_call_listener }