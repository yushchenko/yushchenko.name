var
  path = require('path'),
  http = require('http'),
  paperboy = require('./lib/paperboy'),
  fs = require('fs'),

  PORT = 80,
  WEBROOT = path.join(path.dirname(__filename), 'public');

http.createServer(function(req, res) {

  var ip = req.connection.remoteAddress;

  paperboy
    .deliver(WEBROOT, req, res)
    .addHeader('Expires', 300)
    .addHeader('X-PaperRoute', 'Node')
    // .before(function() {
    //   console.log('Received Request');
    // })
    .after(function(statCode) {
      log(statCode, req.url, ip);
    })
    .otherwise(function(err) {
      res.writeHead(404, {'Content-Type': 'text/html'});
      fs.readFile(path.join(WEBROOT, '404.html'), function (err, data) {
          res.end(data);
      });
      log(404, req.url, ip, err);
    });

    // .error(function(statCode, msg) {
    //   res.writeHead(statCode, {'Content-Type': 'text/plain'});
    //   res.end("Error " + statCode);
    //   log(statCode, req.url, ip, msg);
    // })

}).listen(PORT);

console.log('Listening port ' + PORT);

function log(statCode, url, ip, err) {
  var logStr = statCode + ' - ' + url + ' - ' + ip;
  if (err)
    logStr += ' - ' + err;
  console.log(logStr);
}