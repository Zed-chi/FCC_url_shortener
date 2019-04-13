'use strict';

var dns        = require("dns");
var express    = require('express');
var mongo      = require('mongodb');
var mongoose   = require('mongoose');
var bodyParser = require("body-parser");
var cors       = require('cors');


mongoose.connect(process.env.uri, { useNewUrlParser: true });
const Schema = mongoose.Schema;
const urlScheema = new Schema({
  url:String,
  short:Number
});
const Url = mongoose.model('Url', urlScheema);


var app = express();
var port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use('/public', express.static(process.cwd() + '/public'));


/* routes */
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.post("/api/shorturl/new", function(req, res){
  var unparsedUrl = req.body.url;
  var parsedUrl = require("url").parse(unparsedUrl);
  var urlToCheck = parsedUrl.host;
  if ( !parsedUrl.host ) {urlToCheck = unparsedUrl}
  dns.lookup(urlToCheck, (e,a,f)=>{
    if (e) {
      console.log("Error", e);
      return res.json({"message": "DNS resolving error, invalid url"});
    }
    else {
      console.log("Success" , a, f);      
      Url.findOne({url:unparsedUrl}, (err, doc)=>{
        if (err || doc == null) {
          console.log("not in db");
          Url.countDocuments({}, (err, count)=>{
            if (err){
              var num = 0;
              console.log("Num is", num);
              var item = new Url({url:unparsedUrl, short:num+1});
              item.save((err, result)=>{
                if (err) {
                  console.log("Error while saving");
                  return res.json({"message": "Error while saving"});
                }
                else {
                  console.log("Saving success");
                  return res.json({url:result.url, short:result.short});
                }
              });
            }
            else{
              var num = count;
              console.log("Num is", num);
              var item = new Url({url:unparsedUrl, short:num+1});
              item.save((err, result)=>{
                if (err) {
                  console.log("Error while saving");
                  return res.json({"message": "Error while saving"});
                }
                else {
                  console.log("Saving success");
                  return res.json({url:result.url, short:result.short});
                }
              });
            }
          });
        }
        else {
          console.log("Item in db", doc);
          return res.json({url:doc.url, short:doc.short});
        }
      });
    }
  })
});


app.get("/shorturl/:num?", function(req, res){
  var num = req.params.num;
  if (num) {
    Url.findOne({short:num}, (err, item)=>{
      if (err || item == null) {
        return res.json({message: "Didn't find shortcode in db"}); 
      }
      else {
        res.writeHead(302, {'Location': item.url});
        return res.end();
      }
    });
  }
  else {
    return res.json({message: "Invalid short code"});
  }
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});