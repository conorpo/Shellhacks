const twilio = require("twilio");

const dotenv = require("dotenv");
dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const { createCall } = require("./call.js");

const client = twilio(accountSid, authToken);

async function handle_call(business, phone_number) {
    const call = await createCall(client, phone_number);
    const call_sid = call.sid;

    // const stream = client.calls(call_sid)
    //             .streams.create({
    //                 nam   
    //             })
}

handle_call({}, "4074350184");