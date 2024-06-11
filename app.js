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
const Throttle = require('stream-throttle').Throttle;
const configApp = require('./config');

app.use(cors());
app.use('/content', express.static('./content'));

let keywords = {
  "images": [`${configApp.server_host}content/cat-1.jpg`, `${configApp.server_host}content/cat-2.jpg`],
  "text": [`${configApp.server_host}content/text1.txt`, `${configApp.server_host}content/text2.txt`]
};

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < configApp.numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      let urls = keywords[message];
      if(urls) {
        let data = urls.map(url => {
          let filePath = path.join(__dirname, url.replace(configApp.server_host, '/'));
          let stats = fs.statSync(filePath);
          let readStream = fs.createReadStream(filePath);
          let throttle = new Throttle({rate: configApp.speed_stream}); 
          readStream.pipe(throttle);
          return {
            url: url,
            size: stats.size,
            threads: configApp.numCPUs
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