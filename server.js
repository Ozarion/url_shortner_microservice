'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();
var dns = require('dns');
// Basic Configuration 
var port = process.env.PORT || 3000;

//URL Validation
const validateUrl = (url) => {
  const regexUrl = /^(ftp|http|https):\/\/[^ "]+$/;
  return regexUrl.test(url);
};

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, (err) => {
  return (err) ? console.log("Connection Failed with Database") : console.log("Connection Successful")
});

const Schema = mongoose.Schema;

//creating schemas
const counterSchema = new Schema({
  _id : { type : String, required : true },
  seq : { type : Number, default : 0 }
});

const urlSchema = new Schema({
  original_url : String,
  short_url : Number
});

//creating a models from urlSchema
const Counter = mongoose.model('UrlCounter', counterSchema);
const URL = mongoose.model('UrlDb', urlSchema);

const counter = new Counter({ "_id" : "count", "seq" : 0 });

counter.save().then(() => console.log("Saved the counter"));

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

/* Only for testing database
app.get('/testCounter', (req, res) => {
  Counter.find((err, counterDoc) => {
    if (err) res.send(err);
    res.send(counterDoc);
  });
});

app.get('/testDb', (req, res) => {
  URL.find((err, allUrl) => {
    if (err) res.send(err);
    res.send(allUrl);
  })
})
*/

app.post('/api/shorturl/new', ( req, res) => {
  const originalUrl = req.body.url;
  
  if (!validateUrl(originalUrl)) {
    res.json({
      "error" : "invalid URL"
    });
    return;
  };
  
  Counter.findByIdAndUpdate({_id : "count"}, { $inc : {seq : 1} }, (err, counter) => {
    if (err) res.json({ "ERROR" : err });
    const newUrl = new URL({"original_url" : originalUrl, "short_url" : counter.seq});
    newUrl.save((err, doc) => {
      if (err) res.json({ "ERROR" : err});
      res.json({"original_url" : doc.original_url, "short_url" : doc.short_url});
    });
  });
  
});

app.get('/api/shorturl/:shortLink', (req, res) => {
    URL.findOne({"short_url" : req.params.shortLink}, (err, doc) => {
      if (err) res.send(err);
      res.redirect(doc.original_url);
    });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
