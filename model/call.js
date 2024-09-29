const VoiceResponse = require('twilio').twiml.VoiceResponse;

async function createCall(client, call) {

    const response = new VoiceResponse();

    const start = response.start();
    start.stream({
        name: 'Example Audio Stream',
        url: 'wss://6a08-12-75-74-5.ngrok-free.app',
    });
    
    response.say('The stream has started.The stream has started.The stream has started.The stream has started.The stream has started.The stream has started.The stream has started.The stream has started.The stream has started.The stream has started.');

    response.pause({
        length: 60
    })

    return await client.calls.create({
        from: "+18667574224",
        to: `+1${call.phone_number}`,
        twiml: response.toString(),
    });
}
  

module.exports = { createCall };
  