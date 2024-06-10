// Сервер
const express = require('express');
const WebSocket = require('ws');
const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const numCPUs = 4; //require('os').cpus().length;
const SERVER_HOST = "http://localhost:3000/";

app.use(cors());
app.use('/content', express.static('./content'));

let keywords = {
  "images": [`${SERVER_HOST}content/cat-1.jpg`, `${SERVER_HOST}content/cat-2.jpg`],
  "text": [`${SERVER_HOST}content/text1.txt`, `${SERVER_HOST}content/text2.txt`]
};

if (cluster.isMaster) {
  console.log(numCPUs);
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      console.log(numCPUs);
      let urls = keywords[message];
      if(urls) {
        let data = urls.map(url => {
          let filePath = path.join(__dirname, url.replace(SERVER_HOST, '/'));
          let stats = fs.statSync(filePath);
          return {
            url: url,
            size: stats.size,
            threads: numCPUs
          };
        });
        ws.send(JSON.stringify(data));
      } else {
        ws.send(JSON.stringify([]));
      }
    });
  });

  server.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}