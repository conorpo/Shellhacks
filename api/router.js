const express = require("express");
const router = express.Router();
const bcrypt = require('bcryptjs'); // For password hashing
const jwt = require('jsonwebtoken'); // For token generation
require('dotenv').config(); // Load environment variables
const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI; // Ensure you have the URI set
const clientMongo = new MongoClient(uri);

const { updateCompanyConfig, readCompanyConfig } = require('../app/db.js');
const { initiate_call } = require("../app/call_manager.js");

// Middleware for token verification (if needed)
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from 'Bearer <token>'
  if (!token) return res.sendStatus(403);

  jwt.verify(token, process.env.JWT, (err, user) => { // Corrected typo 'process'
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Register route
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    await clientMongo.connect();
    const db = clientMongo.db('Company'); // Use your database
    const usersCollection = db.collection('users');
    
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username,
      password: hashedPassword,
    };

    await usersCollection.insertOne(newUser);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Registration failed' });
  } finally {
    await clientMongo.close();
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    await clientMongo.connect();
    const db = clientMongo.db('Company');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { username: user.username, userId: user._id },
      process.env.JWT,  // Use the secret key from the environment variable
      { expiresIn: '1h' } // Token expires in 1 hour
    );
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Login failed' });
  } finally {
    await clientMongo.close();
  }
});


// Other routes (protected if necessary)
router.post('/updateCompany', async (req, res) => {
  const { companyName, description, objectives, opener } = req.body;

  console.log("UPDATE:", companyName, description, objectives, opener);
  
  try {
    updateCompanyConfig(companyName, description, objectives, opener);
    res.status(200).json({ message: 'Company updated successfully' });
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    res.status(500).json({ message: 'Failed to update AI configuration' });
  }
});

router.post('/initiateCalls', async  (req, res) => {
  const { phone_numbers, companyName } = req.body;

  console.log("INITIATE:" ,phone_numbers, companyName);

  const company_config = await readCompanyConfig(companyName);
  if (!company_config) {
    return res.status(400).json({ message: "Company data is not set." });
  }

  for (let phone_number of phone_numbers) {
    console.log(phone_number);
    const new_number = phone_number.replace(/\D/g, '');
    const no_ext = new_number.slice(-10);
    console.log(`Calling ${no_ext}`);

    initiate_call(company_config, no_ext);
  }

  res.send("Calls started");
});

router.post('/readCompany', authenticateToken, (req, res) => {
  const { companyName } = req.body;
  const company_config = readCompanyConfig(companyName);

  if (company_config) {
    res.send(company_config);
  } else {
    res.status(404).json({ message: "Company does not exist" });
  }
});


router.post('/fetchResults', async (req, res) => {
  const { businessName } = req.body;

  try {
    // Connect to the MongoDB client
    await clientMongo.connect();
    const db = clientMongo.db('Company');
    const usersCollection = db.collection('CallAnalysis');

    // Use toArray() to get the results in an array format
    const users = await usersCollection.find({
      "businessName": { $regex: businessName, $options: "i" }
    }).toArray(); // Ensure to convert the cursor to an array

    console.log("USERS:", users); // Log the result

    // Check if the array is empty instead of checking for 'user'
    if (users.length === 0) {
      return res.status(400).json({ message: 'Business not found' });
    }

    // Send the found users as the response
    res.json(users);
  } catch (error) {
    console.error('Error finding business in:', error);
    res.status(500).json({ message: 'Could not find business' });
  } finally {
    // Ensure to close the client in a finally block to avoid leaving connections open
    await clientMongo.close();
  }
});









module.exports = { router };
