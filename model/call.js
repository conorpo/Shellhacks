async function createCall(client, phone_number) {
    return await client.calls.create({
        from: "+18667574224",
        to: `+1${phone_number}`,
        twiml: `<Response><Say>Hello Conor, would you like to play a game.!</Say></Response>
                <Start><Stream>
                `,
    });
}
  

module.exports = { createCall };
  