const OpenAI = require('openai');
const dotenv = require('dotenv');
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const fs = require('fs');

const { WaveFile } = require('wavefile');

const { PassThrough } = require('stream');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

// ______________________ INITIALIZATION ______________________

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const polly = new PollyClient({ region: process.env.AWS_REGION || 'us-east-1', credentials: getAWSCredentials() });

function getAWSCredentials() {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const PlayHT = require("playht");

PlayHT.init({
    apiKey: process.env.PLAY_HT_KEY,
    userId: "CuPrxvqnTqYgHnVNqcmzqyPFBLw1",
});


// ______________________ TEXT GENERATION AND SPEECH ______________________

async function generateResponse(business_info, chatHistory) {
  try {
    const messages = [
      { role: 'system', content: generateSystemPrompt(business_info) },
      ...chatHistory,
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 100,
      temperature: 0.7,
    });

    const ai_response = response.choices[0].message.content.trim();

    // Generate speech from the AI response
    const speechStream = await textToSpeech2(ai_response);

    return { ai_response, speechStream };
  } catch (error) {
    console.error('Error generating response:', error);
    return { 
      ai_response: 'Sorry, I encountered an issue generating a response.', 
      chatHistory: [],
      speechFile: null
    };
  }
}

function generateSystemPrompt(business_info) {
  const { companyName, description, objectives } = business_info;
  console.log(objectives);

  return `
    You are a friendly and persuasive AI sales assistant for ${companyName}, company description: ${description}.
    Your main objectives are: ${objectives.join('; ')}.
    Act as a professional sales representative within the field, tailoring your conversation to prospects in this specific niche.
    Estimate the type of people you are calling based on the company information provided and adjust your approach accordingly.
    Respond to the customer in a helpful and professional manner.

    Rules:
    - Do not talk about the company's services in a way that is not helpful or professional.
    - TAKE CONTROL OF THE CALL AND MAKE SURE TO PROGRESS THE CONVERSATION THROUGH THE OBJECTIVE LIST
    - Pitch the sale in less than 4 responses.
    - Do not get off track from the conversation and the objectives of the call.
    - Do not be too wordy.
    - Make sure to guide the customer with open-ended questions to learn more about their needs and pain points.
    - Make sure to get the customer to the final objective by funneling the conversation through the initial objectives.
  `;
}


async function textToSpeech2(text) {
  const streamFromStream = await PlayHT.stream(text, {
    voiceEngine: 'PlayHT2.0-turbo',
    voiceId: 's3://peregrine-voices/oliver_narrative2_parrot_saad/manifest.json',
    outputFormat: 'mulaw',
    sampleRate: 8000,
  });

  return streamFromStream;
}


// ______________________ TEXT-TO-SPEECH ______________________


function createWavFile(pcmData, sampleRate = 16000, bitDepth = 16, channels = 1) {
  const byteRate = (sampleRate * channels * bitDepth) / 8;
  const blockAlign = (channels * bitDepth) / 8;
  const wavHeader = Buffer.alloc(44); // WAV header is 44 bytes long

  // ChunkID "RIFF"
  wavHeader.write('RIFF', 0);
  // ChunkSize (36 + data size)
  wavHeader.writeUInt32LE(36 + pcmData.length, 4);
  // Format "WAVE"
  wavHeader.write('WAVE', 8);
  // Subchunk1ID "fmt "
  wavHeader.write('fmt ', 12);
  // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt32LE(16, 16);
  // AudioFormat (1 for PCM)
  wavHeader.writeUInt16LE(1, 20);
  // NumChannels (mono = 1, stereo = 2)
  wavHeader.writeUInt16LE(channels, 22);
  // SampleRate (e.g., 16000)
  wavHeader.writeUInt32LE(sampleRate, 24);
  // ByteRate (SampleRate * NumChannels * BitsPerSample / 8)
  wavHeader.writeUInt32LE(byteRate, 28);
  // BlockAlign (NumChannels * BitsPerSample / 8)
  wavHeader.writeUInt16LE(blockAlign, 32);
  // BitsPerSample (e.g., 16)
  wavHeader.writeUInt16LE(bitDepth, 34);
  // Subchunk2ID "data"
  wavHeader.write('data', 36);
  // Subchunk2Size (NumSamples * NumChannels * BitsPerSample / 8)
  wavHeader.writeUInt32LE(pcmData.length, 40);

  // Combine header and PCM data
  return Buffer.concat([wavHeader, pcmData]);
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of Readable.from(stream)) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// ______________________ MODULE EXPORTS ______________________

module.exports = {
  generateResponse,
};