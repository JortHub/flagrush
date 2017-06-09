var canvas = document.getElementById('cvs');
var gui = document.getElementById('gui');
var view = new viewport(canvas);

var main = io();
var server = null;

main.on("server" , function(arg) {
	if(arg != null) {
		server = io(arg);
	}
	else {
		server = main;
	}

	start();
});

function start() {
	server.on("joined", function() {
		console.log("Joined");
	});

	server.emit("join");
}