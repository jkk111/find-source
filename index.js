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

app.post("/source/link", function(req, res) {
  var first = req.body.first;
  var second = req.body.second;
  if(first && second && exists(first, second)) {
    sources[first].links.push(second);
    if(sources[first].indexOf(req.ip) == -1)
      sources[first].ips.push(req.ip);
    sources[second].links.push(first);
    if(sources[second].indexOf(req.ip) == -1)
      sources[second].ips.push(req.ip);
  } else {
    if(first && second)
      res.status(404).send("Source not found");
    else {
      res.status(400).send("Invalid request");
    }
  }
})

function exists() {
  for(var i = 0 ; i < arguments.length; i++) {
    if(!sources[arguments[i]]) return false;
  }
  return true;
}

// Checks if a source exists
function checkSrc(srcId, ip, name) {
  if(!sources[srcId])
    sources[srcId] = { timesChecked: 0, id: srcId, added: ((new Date()).getTime()), ips: [], sources: [], names: [], links: [] }
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

// Only sends necessary data, strips source ips.
function sanitize(obj) {
  var sanitized = {};
  sanitized.id = obj.id;
  sanitized.sources = [];
  for(var i = 0 ; i < obj.sources.length; i++) {
    sanitized.sources.push({id: i, source: obj.sources[i].source});
  }
  return sanitized;
}