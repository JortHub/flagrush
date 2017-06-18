var express = require('express');
var app = express();
var server = app.listen(8888);
var io = require('socket.io').listen(server);

console.log("Main server started on the port 8888");

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
  socket.on("broadcast", function() {
  	
  });

  socket.emit("server", chooseServer());
});

// Create a server JUST FOR NOW
var server = require("./server/server")(io);