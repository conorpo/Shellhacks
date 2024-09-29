const OpenAI = require('openai');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Initialize OpenAI API with the API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// MongoDB URI and Client initialization
const mongoUri = process.env.MONGO_URI;
const client = new MongoClient(mongoUri);

// Function to analyze call data and store the results in MongoDB
async function analyzeAndStoreCallData(messageHistory, businessName, phone_number) {
  try {
    // Connect to MongoDB client
    await client.connect();
    
    // Select the 'Company' database and the 'Customer' collection
    const db = client.db('Company');
    const callAnalysisCollection = db.collection('CallAnalysis');

    // Analyze the conversation using OpenAI and extract key information
    const analysis = await analyzeCall(messageHistory, businessName);
    // console.log('AI Analysis Response:', analysis);  // Log the AI response

    const customerInfo = extractCustomerInfo(analysis, phone_number);
    // console.log('Extracted Customer Info:', customerInfo);  // Log extracted info

    // Store the call analysis and customer information in the collection
    await callAnalysisCollection.insertOne({
      businessName,
      messageHistory,
      analysis,
      customerInfo,
      timestamp: new Date(),
    });

    // console.log('Call analysis and customer info stored successfully');
    return customerInfo;
  } catch (error) {
    // console.error('Error in analyzeAndStoreCallData:', error);
  } finally {
    // Ensure the MongoDB client is closed after the operation
    await client.close();
  }
}

// Function to analyze the call using OpenAI's chat completion model
async function analyzeCall(messageHistory, businessName) {
  // Create a prompt to analyze the call and extract the required information
  const prompt = `
    As an AI assistant for ${businessName}, analyze the following conversation and extract key information about the customer and the call. Focus on:
    1. Customer's name
    2. Customer's contact email
    3. Customer's needs or pain points
    4. Any products or services discussed
    5. Next steps or follow-up actions
    6. Overall ranking of how likely the client is to close on a scale of 1-5 (Please state: "Overall ranking: [1-5]")

    Conversation:
    ${messageHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

    Provide a concise summary of the key points and any actionable insights.
  `;

  // Use OpenAI's chat completion endpoint to analyze the conversation
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  });

  // Return the AI's analysis as a trimmed string
  return response.choices[0].message.content.trim();
}

// Function to extract structured customer information from the AI analysis
// Function to extract structured customer information from the AI analysis
// Function to extract structured customer information from the AI analysis
function extractCustomerInfo(analysis, phone_number) {
    return {
      name: extractValue(analysis, /Customer's name:?\s*(.+)/i) || 'Not provided',
      contactInfo: {
        phone: phone_number || 'Not provided',
        email: extractValue(analysis, /Customer's contact email:?\s*(.+)/i) || 'Not provided',
      },
      needs: extractValue(analysis, /Customer's needs or pain points:?\s*(.+)/i) || 'Not provided',
      productsDiscussed: extractValue(analysis, /Products or services discussed:?\s*(.+)/i) || 'Not provided',
      nextSteps: extractValue(analysis, /Next steps or follow-up actions:?\s*(.+)/i) || 'Not provided',
      ranking: extractValue(analysis, /Overall ranking:?\s*(\d+)/i) || 'Not provided',
    };
  }
  
  // Helper function to extract specific values from the AI's analysis text
  function extractValue(text, regex) {
    const match = text.match(regex);
    if (match) {
    //   console.log(`Extracted value for regex ${regex}: ${match[1].trim()}`); // Debug log for extracted value
    }
    return match ? match[1].trim() : '';
  }
  
  

module.exports = { analyzeAndStoreCallData };
