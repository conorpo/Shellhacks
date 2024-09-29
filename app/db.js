const { MongoClient } = require('mongodb');
require('dotenv').config();
// MongoDB connection string - replace with your actual connection string
const uri = process.env.mongo_URI;
const clientMongo = new MongoClient(uri);

let configCollection;

// Connect to MongoDB
async function connectToMongo() {
  try {
    await clientMongo.connect();
    const db = clientMongo.db('Company');
    configCollection = db.collection('Company');
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
}

// Connect to MongoDB when routes file is loaded
connectToMongo();

// Route for updating AI configuration
async function updateCompanyConfig(companyName, description = "default", objectives="default", opener="default") {
  try {
    // Insert new configuration
    const result = await configCollection.findOneAndUpdate(
      { companyName },
      {
        $set: { // Use the $set operator to update only the specified fields
          companyName,
          description,
          objectives,
          opener
        }
      },
      {
        returnNewDocument: true,
        upsert: true 
      }
    );

    return result;
  } catch (error) {
    console.error('Error updating AI configuration:', error);
  }
};


// Route for updating AI configuration
async function readCompanyConfig(companyName) {
  try {
    const ret = await configCollection.findOne({ companyName })
    //console.log(companyName, services, objectives)

    return ret;
    
  } catch (error) {
    return ret
  }
};








module.exports = { updateCompanyConfig, readCompanyConfig};
