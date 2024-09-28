const OpenAI = require('openai');
const dotenv = require('dotenv');
const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const fs = require('fs');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

// ______________________ INITIALIZATION ______________________

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const polly = new PollyClient({ region: process.env.AWS_REGION || 'us-east-1', credentials: getAWSCredentials() });
const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1', credentials: getAWSCredentials() });

// Hard-coded session ID
const CURRENT_SESSION_ID = '125678';

function getAWSCredentials() {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}





// ______________________ TEXT GENERATION AND SPEECH ______________________

async function generateResponse(business_info, latest_user_message) {
  try {
    const chatHistory = await getChatHistory();
    const messages = [
      { role: 'system', content: generateSystemPrompt(business_info) },
      ...chatHistory,
      { role: 'user', content: latest_user_message }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 150,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0].message.content.trim();
    console.log('AI Response:', aiResponse);  // Print AI response

    await updateChatHistory(chatHistory, latest_user_message, aiResponse);
    await storeCustomerInfo(latest_user_message, aiResponse);

    // Generate speech from the AI response
    const speechFile = await textToSpeech(aiResponse);

    return { aiResponse, chatHistory, speechFile };
  } catch (error) {
    console.error('Error generating response:', error);
    return { 
      aiResponse: 'Sorry, I encountered an issue generating a response.', 
      chatHistory: [],
      speechFile: null
    };
  }
}

function generateSystemPrompt(business_info) {
  const { name, services, objectives } = business_info;
  return `
    You are a customer service AI assistant for ${name}. 
    The company offers ${services.join(', ')}. 
    Your main objectives are: ${objectives.join(', ')}. 
    Respond to the customer in a helpful and professional manner.
  `;
}




// ______________________ TEXT-TO-SPEECH ______________________

async function textToSpeech(text) {
  try {
    const { AudioStream } = await polly.send(new SynthesizeSpeechCommand({
      OutputFormat: 'mp3',
      Text: text,
      TextType: 'text',
      VoiceId: 'Matthew',
      Engine: 'neural',
    }));

    if (!AudioStream) throw new Error('AudioStream is empty or undefined');

    const audioBuffer = await streamToBuffer(AudioStream);
    const fileName = `response_${Date.now()}.mp3`;
    fs.writeFileSync(fileName, audioBuffer);

    // Confirm if audio file was created
    if (fs.existsSync(fileName)) {
      console.log(`Audio file '${fileName}' has been successfully created.`);
      return fileName;
    } else {
      console.log(`Failed to create audio file '${fileName}'.`);
      return null;
    }
  } catch (error) {
    console.error('Error converting text to speech:', error);
    return null;
  }
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of Readable.from(stream)) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}





// ______________________ CHAT HISTORY MANAGEMENT ______________________

async function getChatHistory() {
  try {
    const { Item } = await dynamodb.send(new GetItemCommand({
      TableName: 'ChatHistory',
      Key: { SessionID: { S: CURRENT_SESSION_ID } }
    }));
    // console.log('Item:', Item, Item.History,);
    return Item && Item.History ? JSON.parse(Item.History.S) : [];
  } catch (error) {
    console.error('Error retrieving chat history:', error);
    throw error;
  }
}

async function updateChatHistory(chatHistory, userMessage, aiResponse) {
  try {
    chatHistory.push({ role: 'user', content: userMessage });
    chatHistory.push({ role: 'assistant', content: aiResponse });
    
    await dynamodb.send(new PutItemCommand({
      TableName: 'ChatHistory',
      Item: {
        SessionID: { S: CURRENT_SESSION_ID },
        History: { S: JSON.stringify(chatHistory) },
        Timestamp: { N: Date.now().toString() }
      }
    }));
  } catch (error) {
    console.error('Error updating chat history:', error);
    throw error;
  }
}






// ______________________ CUSTOMER INFORMATION STORAGE ______________________

async function storeCustomerInfo(userMessage, aiResponse) {
  try {
    const scheduledCall = extractScheduledCall(userMessage, aiResponse);
    if (scheduledCall) {
      await dynamodb.send(new PutItemCommand({
        TableName: 'CustomerInteractions',
        Item: {
          CustomerId: { S: `customer_${Date.now()}` },
          Timestamp: { N: Date.now().toString() },
          UserMessage: { S: userMessage },
          AIResponse: { S: aiResponse },
          ScheduledCall: { S: scheduledCall },
        },
      }));
    }
  } catch (error) {
    console.error('Error storing customer information:', error);
  }
}

function extractScheduledCall(userMessage, aiResponse) {
  const combinedText = `${userMessage} ${aiResponse}`.toLowerCase();
  const dateRegex = /(\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}|\d{4}-\d{2}-\d{2})/i;
  const timeRegex = /(\d{1,2}:\d{2}\s*(am|pm)?)/i;

  const dateMatch = combinedText.match(dateRegex);
  const timeMatch = combinedText.match(timeRegex);

  return (dateMatch && timeMatch) ? `${dateMatch[0]} at ${timeMatch[0]}` : null;
}





// ______________________ MODULE EXPORTS ______________________

module.exports = {
  generateResponse,
  textToSpeech,
};