var express = require("express");
var app = express();
var fs = require("fs");
app.use(express.static("static/"));
var bp = require("body-parser");
app.use(bp.urlencoded({extended: true}));

var sources = loadSources();

app.post("/source", function(req, res) {
  var srcId = req.body.srcId;
  if(srcId) {
    checkSrc(srcId, req.ip);
    sources[srcId].timesChecked++;
    res.json(sources[srcId]);
    saveSources();
  } else res.status(400).send("NO MD5 SPECIFIED");
});

app.post("/source/add", function(req, res) {
  var srcId = req.body.srcId;
  var src = req.body.source;
  if(srcId && src) {
    checkSrc(srcId, req.ip);
    if(sources[srcId].sources.indexOf(src) == -1)
      sources[srcId].sources.push(src);
    res.json(sources[srcId]);
    saveSources();
  } else {
    res.status(400).send("NO " + (srcId != undefined ? "SOURCE": "MD5") + " SPECIFIED");
  }
});

function checkSrc(srcId, ip) {
  if(!sources[srcId])
    sources[srcId] = { timesChecked: 0, id: srcId, added: ((new Date()).getTime()), ips: [], sources: [] }
  if(ip && sources[srcId].ips.indexOf(ip) == -1)
    sources[srcId].ips.push(ip);
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