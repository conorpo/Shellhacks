const OpenAI = require('openai');
const dotenv = require('dotenv');
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly'); // AWS SDK v3 for Polly
const fs = require('fs');
const { Readable } = require('stream'); // Import the Readable stream module

// Load environment variables from a .env file
dotenv.config();

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const polly = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper functions
const formatServices = (services) => services ? services.join(', ') : 'various services';
const formatObjectives = (objectives) => objectives
  ? objectives.map((obj, index) => `${index + 1}. ${obj}`).join('\n')
  : '1. Provide excellent customer service\n2. Assist with inquiries\n3. Promote services';

/**
 * Generate a response using OpenAI's chat-based model based on business info and chat history.
 * @param {Object} business_info - Contains the business name, services, and objectives path.
 * @param {Array} chat_history - List of previous interactions.
 * @returns {String} - AI-generated response.
 */
async function generateResponse(business_info, chat_history) {
  try {
    const { name: businessName, services, objectives } = business_info;
    const messages = [
      {
        role: 'system',
        content: `You are a customer service AI assistant for ${businessName}. The company offers ${formatServices(services)}. ` +
                 `Your main objectives are:\n${formatObjectives(objectives)}. Respond to the customer in a helpful and professional manner.`,
      },
      ...chat_history.flatMap(entry => [
        { role: 'user', content: entry.customer },
        { role: 'assistant', content: entry.ai }
      ]),
      { role: 'user', content: chat_history[chat_history.length - 1].customer }
    ];

    console.log('Sending request to OpenAI for generating response...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    console.log('Response received from OpenAI: ', response.choices[0].message.content.trim());
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating response:', error);
    return 'Sorry, I encountered an issue generating a response.';
  }
}

/**
 * Convert the generated text response into speech using Amazon Polly.
 * @param {String} text - The text to convert into speech.
 */
async function textToSpeech(text) {
  try {
    console.log('Sending request to Amazon Polly for text-to-speech conversion...');
    const { AudioStream } = await polly.send(new SynthesizeSpeechCommand({
      OutputFormat: 'mp3',
      Text: text,
      TextType: 'text',
      VoiceId: 'Matthew',
      Engine: 'neural',
    }));

    if (!AudioStream) throw new Error('AudioStream is empty or undefined');

    console.log('Received AudioStream from Polly. Processing the audio stream...');
    const audioBuffer = await streamToBuffer(AudioStream);
    
    const fileName = 'response.mp3';
    fs.writeFileSync(fileName, audioBuffer);
    
    console.log(`Audio saved successfully as ${fileName} (${audioBuffer.length} bytes).`);
  } catch (error) {
    console.error('Error converting text to speech:', error);
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of Readable.from(stream)) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Example usage for testing
(async () => {
  const business_info = {
    name: 'Tech Solutions Inc.',
    services: ['IT support', 'cloud services', 'software development'],
    objectives: [
      'Assist customers in understanding our IT and cloud services.',
      'Guide potential customers to book a consultation call.',
      'Encourage clients to make a purchase or upgrade their existing service plans.',
    ],
  };

  const chat_history = [
    { customer: 'Hello, I’m looking for cloud solutions.', ai: 'Hi there! We provide various cloud services, including migration and management. How can I assist you today?' },
    { customer: 'Can you tell me more about cloud migration?', ai: 'Sure! Our cloud migration services include strategy planning, data transfer, and integration.' },
  ];

  const aiResponse = await generateResponse(business_info, chat_history);
  console.log('Generated AI Response:', aiResponse);

  await textToSpeech(aiResponse); // Convert the generated text to speech using Polly
})();
