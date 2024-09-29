async function createCall(client, call) {
    return await client.calls.create({
        from: "+18667574224",
        to: `+1${call.phone_number}`,
        twiml: 
        `<Response>
        <Start>
            <Stream name="Example Audio Stream" url="wss://0fd4aerzzf.execute-api.us-east-1.amazonaws.com/production/" />
        </Start>
        <Say>Hello Conor, would you like to play a game.!</Say>
        </Response>`,
    });
}
  

module.exports = { createCall };
  