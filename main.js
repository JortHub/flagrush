var express = require('express');
var compression = require('compression');
var app = express();
var server = app.listen(80);
var io = require('socket.io').listen(server);
var crypto = require('crypto');

app.use(compression());

console.log("Main server started on the port 80");

var servers = [
	
];

function chooseServer() {
	return servers[Math.floor(Math.random() * servers.length)];
}

// Sends the main file
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

// All the other files
app.use(express.static(__dirname + '/public'));

// In case of a 404 error
app.get('*', function(req, res){
  res.send("Error 404: Page wasn't found, please try something else!", 404);
});

// Connection
io.on('connection', function(socket){
  socket.on("broadcast", function(code, message) {
  	code = crypto.createHash('md5').update(code).digest('hex');

  	if(code == "4eaf2ff75c42c06f31bbede5591d7f46") {
  		io.emit("broadcast", message);
  		console.log("Broadcasted " + message);
  	}
  });

  socket.on("server", function() {
  	socket.emit("server", chooseServer());
  });
});

// Create a server JUST FOR NOW
var server = require("./server/server")(io);