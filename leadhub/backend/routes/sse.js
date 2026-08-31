const express = require('express');
const jwt = require('jsonwebtoken');
const { addClient, removeClient } = require('../services/sseService');

const router = express.Router();

// EventSource can't send Authorization headers, so the token is passed as
// a query param here and verified the same way as the normal auth middleware.
router.get('/', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).end();

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    userId = decoded.id;
  } catch (err) {
    return res.status(401).end();
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  addClient(String(userId), res);

  const keepAlive = setInterval(() => res.write(':\n\n'), 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeClient(String(userId), res);
  });
});

module.exports = router;
