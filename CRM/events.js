'use strict';

const clients = new Set();

function subscribe(res) {
  clients.add(res);
  res.write('event: hello\ndata: {"ok":true}\n\n');
  return () => clients.delete(res);
}

function publish(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data || {})}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}

function count() {
  return clients.size;
}

module.exports = { subscribe, publish, count };
