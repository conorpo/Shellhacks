require('dotenv').config();

// Import the generateResponse function from text_generation.js
const { generateResponse } = require('./text_generation.js');  // Adjust path if needed

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

// Creates a client
const client = new speech.SpeechClient();

async function quickstart() {
  // The path to the remote LINEAR16 file
  const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw';

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const audio = {
    uri: gcsUri,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Wait for the speech-to-text recognition process to complete
  const [response] = await client.recognize(request);
  
  // Process the transcription once it is ready
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);

  // Business info for text generation
  const business_info = {
    name: 'Tech Solutions Inc.',
    services: ['IT support', 'cloud services', 'software development'],
    objectives: [
      'Assist customers in understanding our IT and cloud services.',
      'Guide potential customers to book a consultation call.',
      'Encourage clients to make a purchase or upgrade their existing service plans.',
    ],
  };

  // Call generateResponse only after transcription is finished
  generateResponse(business_info, transcription);
}

// Call the main function
quickstart();
