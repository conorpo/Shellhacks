// routes.js
const express = require('express');
const db_router = express.Router();
const { generateResponse } = require('../model/text_generation.js');  // Add updateBusinessInfo

// Imports the Google Cloud client library
const speech = require('@google-cloud/speech');

// Creates a Google Cloud Speech client
const client = new speech.SpeechClient();

const { MongoClient } = require('mongodb');
require('dotenv').config();
// MongoDB connection string - replace with your actual connection string
const uri = process.env.mongo_URI;
console.log(uri);

const clientMongo = new MongoClient(uri);

let business_info = {};

// Connect to MongoDB
async function connectToMongo() {
  try {
    await clientMongo.connect();
    console.log("Connected to MongoDB");

//     // Fetch the latest configuration from MongoDB
//     const db = clientMongo.db('Company');
//     const configCollection = db.collection('Company');
//     const latestConfig = await configCollection.findOne({}, { sort: { _id: -1 } });

//     if (latestConfig) {
//       business_info = {
//         name: latestConfig.companyName,
//         services: latestConfig.services.join(', '),
//         objectives: latestConfig.objectives,
//       };
//       console.log("Loaded latest configuration:", business_info);
//       updateBusinessInfo(business_info);  // Update text_generation.js
//     }
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

// Connect to MongoDB when routes file is loaded
connectToMongo();

// Route for updating AI configuration
db_router.post('/configure-ai', async (req, res) => {
  const { companyName, services, objectives } = req.body;

  try {
    const db = clientMongo.db('Company');
    const configCollection = db.collection('Company');

    console.log(companyName, services, objectives)

    // Insert new configuration
    const result = await configCollection.insertOne({
      Name: companyName,
      Services: services,
      Objectives: objectives,
    });

    console.log(result);

    // Update local business_info object
    business_info = {
      name: companyName,
      services: services,
      objectives: objectives,
    };

    console.log('Updated AI configuration:', business_info);
    res.status(200).json({ message: 'AI configuration updated successfully' });
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    res.status(500).json({ message: 'Failed to update AI configuration' });
  }
});


module.exports = { db_router };
