const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Log the directory structure for debugging
const distPath = path.join(__dirname, 'dist/paycile-frontend/browser');
console.log('Looking for static files in:', distPath);
console.log('Directory exists:', fs.existsSync(distPath));

if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  console.log('Files found:', files.slice(0, 5)); // Log first 5 files
}

// Health check endpoint - MUST come before static files
app.get('/health', (req, res) => {
  res.json({ status: 'ok', path: distPath, exists: fs.existsSync(distPath) });
});

// Serve static files from the Angular app
app.use(express.static(distPath));

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  if (!fs.existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    res.status(404).send('index.html not found');
    return;
  }
  
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving files from: ${distPath}`);
}); 