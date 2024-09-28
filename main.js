// Import required modules
const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const { MongoClient } = require('mongodb');
const OpenAI = require('openai');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const twilio = require('twilio-node');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Initialize Google Speech-to-Text client
const speechClient = new SpeechClient();

// Set up MongoDB, OpenAI, and AWS Polly clients
const mongoClient = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let db;
mongoClient.connect().then(client => {
  db = client.db('call_data');
  console.log('Connected to MongoDB');
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const polly = new AWS.Polly({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});




// Route for handling Twilio media streams
app.post('/twilio-stream', async (req, res) => {
  const data = req.body;

  if (data.event && data.event === 'media') {
    const audioContent = Buffer.from(data.media.payload, 'base64');
    const transcript = await processAudioStream(audioContent);

    if (transcript) {
      console.log(`Transcript: ${transcript}`);
      await handleAIResponse(transcript);
      return res.json({ transcript });
    }
  }
  res.json({ status: 'no media event' });
});








// Function to process the audio stream using Google Cloud Speech-to-Text
async function processAudioStream(audioContent) {
  const config = {
    encoding: 'MULAW',
    sampleRateHertz: 8000,
    languageCode: 'en-US',
  };

  const audio = {
    content: audioContent.toString('base64'),
  };

  const [response] = await speechClient.recognize({ config, audio });
  if (response.results && response.results.length) {
    const transcript = response.results[0].alternatives[0].transcript;
    if (/exit|quit/i.test(transcript)) return 'Exiting...';
    return transcript;
  }
  return null;
}







// Function to handle AI response generation and logging
async function handleAIResponse(transcript) {
  const gptResponse = await generateGPTResponse(transcript);
  const pollyAudioStream = await synthesizeWithPolly(gptResponse);

  logCall(transcript, gptResponse);
}

// Function to generate response using OpenAI's GPT
async function generateGPTResponse(transcript) {
  const prompt = `Customer said: '${transcript}'. How should I respond?`;
  const response = await openai.Completions.create({
    engine: 'text-davinci-003',
    prompt,
    max_tokens: 150,
  });
  return response.choices[0].text.trim();
}

// Function to convert text to speech using Amazon Polly
function synthesizeWithPolly(text) {
  return new Promise((resolve, reject) => {
    const params = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: 'Joanna',
    };

    polly.synthesizeSpeech(params, (err, data) => {
      if (err) reject(err);
      else resolve(data.AudioStream);
    });
  });
}

// Function to log call details to MongoDB
function logCall(transcript, gptResponse) {
  const callLog = {
    transcript,
    gpt_response: gptResponse,
    timestamp: new Date(),
  };

  db.collection('calls').insertOne(callLog, (err, result) => {
    if (err) console.error('Error logging call:', err);
    else console.log('Call logged successfully');
  });
}










// Start the Express server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
