const PORT_RANGE = [10000, 50000];
let cur_port = 10000;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilio = require("twilio");

const { createCall } = require("../model/call.js");

const client = twilio(accountSid, authToken);

function get_next_available_port() {
    cur_port += 1;
    return cur_port
}

async function initiate_call(business, phone_number) {
    const new_call = {
        phone_number,
        business
    };

    active_calls.push(new_call);

    const call = await createCall(client, new_call);
    const call_sid = call.sid;

}



const active_calls = [];

module.exports = { initiate_call }