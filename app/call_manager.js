const PORT_RANGE = [10000, 50000];
let cur_port = 10000;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;

let active_calls = {};
  
const client = twilio(accountSid, authToken);


async function initiate_call(business, phone_number) {
    const { opener, companyName } = business;

    const response = new VoiceResponse();

    response.say(opener);
    const start = response.connect();
    start.stream({
        name: `${companyName} ${phone_number} stream`,
        url: 'wss://6a08-12-75-74-5.ngrok-free.app',
    });
    
    
    const call = await client.calls.create({
        from: "+18667574224",
        to: `+1${phone_number}`,
        twiml: response.toString(),
    });

    active_calls[call.sid] = {message_history: [], business, phone_number};

    return call;
}

module.exports = { initiate_call, active_calls }
