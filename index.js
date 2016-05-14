var express = require("express");
var app = express();
var fs = require("fs");
app.use(express.static("static/"));
var bp = require("body-parser");
app.use(bp.urlencoded({extended: true}));

var sources = loadSources();

app.post("/source", function(req, res) {
  var srcId = req.body.srcId;
  var name = req.body.name;
  if(srcId) {
    checkSrc(srcId, req.ip, name);
    sources[srcId].timesChecked++;
    res.json(sanitize(sources[srcId]));
    saveSources();
  } else res.status(400).send("NO MD5 SPECIFIED");
});

app.post("/source/add", function(req, res) {
  var srcId = req.body.srcId;
  var name = req.body.name;
  var src = req.body.source;
  if(srcId && src) {
    checkSrc(srcId, req.ip, name);
    if(sources[srcId].sources.indexOf(src) == -1)
      sources[srcId].sources.push(src);
    res.json(sanitize(sources[srcId]));
    saveSources();
  } else {
    res.status(400).send("NO " + (srcId != undefined ? "SOURCE": "MD5") + " SPECIFIED");
  }
});

function checkSrc(srcId, ip, name) {
  if(!sources[srcId])
    sources[srcId] = { timesChecked: 0, id: srcId, added: ((new Date()).getTime()), ips: [], sources: [], names: [] }
  if(ip && sources[srcId].ips.indexOf(ip) == -1)
    sources[srcId].ips.push(ip);
  console.log(sources[srcId])
  if(name && sources[srcId].names.indexOf(name) == -1)
    sources[srcId].names.push(name);
}

function saveSources() {
  fs.writeFileSync(__dirname + "/sources.json", JSON.stringify(sources, null, "  "));
}

function loadSources() {
  var sources;
  try {
    sources = JSON.parse(fs.readFileSync(__dirname + "/sources.json", "utf8"));
  } catch(e) {
    sources = {};
  }
  return sources;
}

module.exports = app;

function sanitize(obj) {
  var sanitized = {};
  sanitized.id = obj.id;
  sanitized.sources = [];
  for(var i = 0 ; i < obj.sources.length; i++) {
    sanitized.sources.push({id: i, source: obj.sources[i].source});
  }
  return sanitized;
}