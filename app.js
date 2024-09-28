// Import required modules
const express = require('express');
require("dotenv").config();

// Start the Express server
const PORT = process.env.PORT || 5000;

function main() {
  const app = express();

  app.use(express.static('public', {
    
  }));

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  
}
main()
