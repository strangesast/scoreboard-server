var express = require('express');
var bodyParser = require('body-parser');
var noble = require('noble');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
mongoose.Promise = Promise;

const IP = '192.168.1.47';
const ADDR = `mongodb://${ IP }/sportsync`
mongoose.connect(ADDR);
var connection = mongoose.connection;

connection.on('error', console.error.bind(console, 'connection error:'));
connection.once('open', () => {
  console.log(`connection to ${ ADDR } successful`);
  startListening(connection.db);
});

const liveBoardCollectionName = 'live_board';

async function startListening(db) {
  let collection;
  collection = await db.createCollection(liveBoardCollectionName, { capped: true, size: 5e8 });
  //collection = db.collection(liveBoardCollectionName);

  let stream = collection.find({}, { tailable: true, awaitable: true, numberOfRetries: -1 }).limit(1).stream();
  //let doc = await collection.find().sort({ $natural: -1 }).limit(1).toArray();

  stream.on('data', async(doc) => {
    if (doc && doc.docs) {
      let docs = await BoardLayout.find({ _id: { $in: doc.docs }}).exec();
      console.log(docs);
    }
  });
}


var Schema = mongoose.Schema;

var XYSchema = mongoose.Schema ({
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  x_size: { type: Number, default: 0 },
  y_size: { type: Number, default: 0 }
});

var ColorSchema = mongoose.Schema ({
  value_hex: String,
  value_rgb: String
});

var ElementSchema = mongoose.Schema({
  board_widget: String,
  instance_name: String,
  layer: {type: Number, default: 0},
  control_id: {type: Number, default: 0},
  xy: XYSchema,
  fg_color: ColorSchema,
  bg_color: ColorSchema,
  border_color: ColorSchema,
  border_width: {type: Number, default: 0},
  xy_text: XYSchema,
  preferred_font: String,
  sample_text: String
});

var BoardElement = mongoose.model('BoardElement', ElementSchema);

var BoardLayoutSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    index: true
  },
  template: String,
  author: String,
  last_update: String,
  display_type: String,
  board_area: {type: mongoose.Schema.Types.ObjectId, ref: 'XY'},
  default_pos: {type: mongoose.Schema.Types.ObjectId, ref: 'XY'},
  elements: ElementSchema
}, { collection: 'saved_board' });

var BoardLayout = mongoose.model('BoardLayout', BoardLayoutSchema);

/* noble / bleno */
noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning();

  } else {
    noble.stopScanning();
  }
});

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// serve static files in DIR
app.use(express.static('app'));

app.get('/', async(req, res, next) => {
  res.redirect('/index.html');
});

app.get('/status', async(req, res, next) => {
  let code = connection.readyState;
  res.json({
    code,
    message: code == 0 ? 'disconnected' : code ==  1 ? 'connected' : code == 2 ? 'connecting' : code == 3 ? 'disconnecting' : 'unknown'
  });
});

app.route('/current')
.get(async(req, res, next) => {
  let collection = connection.db.collection(liveBoardCollectionName);
  let doc = await collection.find().sort({ $natural: -1 }).limit(1).toArray();

  if (doc[0].docs) {
    let docs = await BoardLayout.find({ _id: { $in: doc[0].docs }}).exec();
    res.json(docs);
  } else {
    res.json(null);
  }
})
.post(async(req, res, next) => {
  let collection = connection.db.collection(liveBoardCollectionName);
  let current = await collection.find().sort({ $natural: -1 }).limit(1).toArray();

  let body = req.body;

  let doc;
  if (ObjectId.isValid(body.id)) {
    doc = await BoardLayout.findById(body.id);

  } else {
    doc = await BoardLayout.findOne(body);

  }

  if (current.length) {
    if (current[0].docs.indexOf(doc._id) != -1) {
      return res.status(203).send();
    }
    current[0].docs.push(doc._id);

  } else {
    current.push({ docs: [] });
  }

  try {
    await collection.insertOne({ docs: current[0].docs });
  } catch (e) {
    console.error(e);
    return next(e);
  }

  res.status(201).json(current[0].docs);
})

app.route('/templates')
// return list of templates
.get(async(req, res, next) => {
  let docs = await BoardLayout.find({}).exec();

  res.json(docs);
})
// create a new template
.post(async(req, res, next) => {
  let body = req.body;
  let template = BoardLayout.create(body);

  await template.save();

  res.json(template);
});

let defaultId = '57c256648d6c8d2470c6a3c5';

app.route('/templates/:id')
.get(async(req, res, next) => {
  let id = req.params.id;

  let doc;
  if (id === 'default') {
    doc = await BoardLayout.findById(defaultId);

  } else if(mongoose.Types.ObjectId.isValid(id)) {
    doc = await BoardLayout.findById(id);

  } else {
    doc = await BoardLayout.find({ name: id }).exec();

  }

  res.json(doc);
})
// create new template based on existing
.post(async(req, res, next) => {
  let id = req.params.id;
  let body = req.body;

  if (!body) {
    let err = new Error('no body in request');
    err.status = 400;
    return next(err);
  }

  let def;
  if (id === 'default') {
    def = await BoardLayout.findById(defaultId);

  } else if (ObjectId.isValid(id)) {
    def = await BoardLayout.findById(id);

  } else {
    def = await BoardLayout.findOne({ name: id });

  }

  if (def == null) {
    let err = new Error('doc with that id or name does not exist');
    err.status = 400;
    return next(err);
  }

  if (!body.name || body.name === def.name) {
    let err = new Error('must specify a unique name');
    err.status = 400;
    return next(err);
  }

  let template = new BoardLayout(Object.assign(def, body));
  await template.save();

  res.json(template);
})
// modify existing template
.put(async(req, res, next) => {
  let id = req.params.id;
  let body = req.body;

  let result;
  if (id === 'default') {
    result = await BoardLayout.findByIdAndUpdate(defaultId, body);

  } else if (ObjectId.isValid(id)) {
    result = await BoardLayout.findByIdAndUpdate(id, body);

  } else {
    result = await BoardLayout.findOneAndUpdate({ name: id }, body);

  }

  res.json(result);
});

app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;

  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  res.json({
    error: { message: err.message, stack: err.stack }
  });
});

app.listen(3000);
