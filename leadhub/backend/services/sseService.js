// Keeps a list of open SSE connections per user and pushes JSON events to them.
const connections = new Map(); // userId -> Set of res objects

function addClient(userId, res) {
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId).add(res);
}

function removeClient(userId, res) {
  const set = connections.get(userId);
  if (set) {
    set.delete(res);
    if (set.size === 0) connections.delete(userId);
  }
}

function broadcast(userId, payload) {
  const set = connections.get(String(userId));
  if (!set) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of set) {
    res.write(data);
  }
}

module.exports = { addClient, removeClient, broadcast };
