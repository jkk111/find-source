var http = require("http");
http.createServer(require("./index.js")).listen(80, function() {
  console.log("running");
});