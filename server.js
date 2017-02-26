var express = require('express');
var noble = require('noble');

noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning();

  } else {
    noble.stopScanning();
  }
});

var app = express();

// serve static files in DIR
app.use(express.static('app'));

app.get('/', async(req, res) => {
  res.redirect('/index.html');
});

app.get('/status', async(req, res) => {
  return res.json({ status: 'OK' });
});

app.listen(3000);
