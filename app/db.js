// routes.js
const express = require('express');
const router = express.Router();
const { generateResponse, updateBusinessInfo } = require('./text_generation.js');  // Add updateBusinessInfo

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

// Creates a Google Cloud Speech client
const client = new speech.SpeechClient();

const { MongoClient } = require('mongodb');

// MongoDB connection string - replace with your actual connection string
const uri = "mongodb+srv://<db_username>:temp123@cluster0.toeai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const clientMongo = new MongoClient(uri);

let business_info = {};

// Connect to MongoDB
async function connectToMongo() {
  try {
    await clientMongo.connect();
    console.log("Connected to MongoDB");

    // Fetch the latest configuration from MongoDB
    const db = clientMongo.db('Company');
    const configCollection = db.collection('ai_config');
    const latestConfig = await configCollection.findOne({}, { sort: { _id: -1 } });

    if (latestConfig) {
      business_info = {
        name: latestConfig.companyName,
        services: latestConfig.services,
        objectives: latestConfig.objectives,
      };
      console.log("Loaded latest configuration:", business_info);
      updateBusinessInfo(business_info);  // Update text_generation.js
    }
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

// Connect to MongoDB when routes file is loaded
connectToMongo();

// Route for updating AI configuration
router.post('/configure-ai', async (req, res) => {
  const { companyName, services, objectives } = req.body;

  try {
    const db = clientMongo.db('Company');
    const configCollection = db.collection('ai_config');

    // Insert new configuration
    await configCollection.insertOne({
      companyName,
      services,
      objectives,
      timestamp: new Date(),
    });

    // Update local business_info object
    business_info = {
      name: companyName,
      services: services,
      objectives: objectives,
    };

    updateBusinessInfo(business_info);  // Update text_generation.js

    console.log('Updated AI configuration:', business_info);
    res.status(200).json({ message: 'AI configuration updated successfully' });
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    res.status(500).json({ message: 'Failed to update AI configuration' });
  }
});

// Speech-to-text example
router.get('/transcribe', async (req, res) => {
  try {
    const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw';
    const audio = { uri: gcsUri };
    const config = { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'en-US' };
    const request = { audio: audio, config: config };

    // Wait for the speech-to-text recognition process to complete
    const [response] = await client.recognize(request);
    const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
    
    console.log(`Transcription: ${transcription}`);

    // Call the generateResponse function
    const generatedResponse = await generateResponse(business_info, transcription);
    res.status(200).json({ transcription, aiResponse: generatedResponse.aiResponse });
  } catch (error) {
    console.error("Error during transcription:", error);
    res.status(500).json({ message: 'Failed to transcribe and generate response' });
  }
});

module.exports = router;
