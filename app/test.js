const { analyzeAndStoreCallData } = require('./crm.js');  // Adjust the filename to your main file name

// Example message history for testing
const messageHistory = [
  { role: 'customer', content: 'Hi, I was looking at your services, but I actually have to go.' },
  { role: 'agent', content: 'No problem. If it’s more convenient, I can send you an email with details.' },
  { role: 'customer', content: 'Yeah, that works. Sorry, gotta run. Bye.' },
  { role: 'agent', content: 'Of course, have a great day!' },
];

// Specify a business name and unique phone number for context
const businessName = 'HKBDSHKBSDCKBCS';
const phone_number = '954-555-4728';





async function testAnalyzeAndStore() {
  try {
    // Run the analysis and store the result in MongoDB
    const result = await analyzeAndStoreCallData(messageHistory, businessName, phone_number);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAnalyzeAndStore();
