const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
