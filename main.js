// All the public variables
var express = require('express');
var compression = require('compression');
var app = express();
var server = app.listen(80);
var io = require('socket.io').listen(server);
var crypto = require('crypto');
var servers = [];

// Set Express to use compressions
app.use(compression());

// Log that the main server has started
console.log("Main server started on the port 80");

// Chooses a server
function chooseServer() {
	return servers[Math.floor(Math.random() * servers.length)];
}

// Sends the main file
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/public/index.html');
});

// Sends the testing file
app.get('/testing', function(req, res) {
	res.sendFile(__dirname + '/public/testing.html');
});

// All the other files
app.use(express.static(__dirname + '/public'));

// In case of a 404 error
app.get('*', function(req, res){
  res.send("Error 404: Page wasn't found, please try something else!", 404);
});

// Connection
io.on('connection', function(socket){
  // When the broadcast message is received
  socket.on("broadcast", function(code, message) {
    // Hash the code send by the client
  	code = crypto.createHash('md5').update(code).digest('hex');

    // If the code is correct emit the message to all the clients
  	if(code == "4eaf2ff75c42c06f31bbede5591d7f46") {
  		io.emit("broadcast", message);
  		console.log("Broadcasted " + message);
  	}
  });

  // When the server message is received
  socket.on("server", function() {
    // Emit the server that was chosen for the client
  	socket.emit("server", chooseServer());
  });
});

// Create a server JUST FOR NOW
var server = require("./server/server")(io);