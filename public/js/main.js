var canvas = document.getElementById('cvs');
var ctx = canvas.getContext("2d");
var gui = document.getElementById('gui');
var view = new viewport(canvas);
var gameloop = new gameloop(update);
var input = new input_(onInput);
var camera = new camera_(canvas);
var players = {};
var me;

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

main.on("disconnect", function() {
	main.disconnect();
	main.close();
});

window.onunload = function(){
	main.disconnect();
	main.close();
	if(server != null) {
		server.disconnect();
		server.close();
	}
};

function start() {
	server.on("joined", function(name) {
		console.log("Joined, " + name + " (" + new Date().toLocaleTimeString() + ")");
		me = new player();
		me.name = name;
		players[name] = me;
	});

	server.on("spawn", function(name, x, y, r) {
		if(name != me.name) {
			console.log("Player " + name + " joined");

			var p = new player();
			p.name = name;
			p.x = x;
			p.y = y;
			p.r = r;
			players[name] = p;
		}
		else {
			var p = players[name];
			p.x = x;
			p.y = y;
			p.r = r;
		}
	});

	server.on("leave", function(name) {
		console.log("Player " + name + " left");

		delete players[name];
	});

	server.on("move", function(name, x, y, r) {
		var p = players[name];
		p.x = x;
		p.y = y;
		p.r = r;
	});

	server.on("disconnect", function() {
		console.log("Left (" + new Date().toLocaleTimeString() + ")");
		server.close();
	});
	
	server.emit("join");
}

gameloop.start();

function update() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for(var n in players) {
		ctx.save();

		if(players[n] == me) {
			camera.setX(players[n].x);
			camera.setY(players[n].y);
			camera.update();

			ctx.translate(camera.middleX(), camera.middleY());
		}
		else {
			ctx.translate(camera.calcX(players[n].x), camera.calcY(players[n].y));
		}

		
		ctx.rotate(players[n].r * Math.PI / 180);
		ctx.fillRect(-100 / 2, -100 / 2, 100, 100);

		ctx.strokeStyle = "#0000FF";
		ctx.beginPath();
		ctx.arc(0, 0, 50, 0, 2 * Math.PI);
		ctx.stroke();

		ctx.restore();
	}
}

function onInput(button, state) {
	if(server != null) {
		server.emit("input", button, state);
	}
}


/*var x1 = 0;
var y1 = 0;
var r1 = 20;

var x2 = 30;
var y2 = 0;
var r2 = 20;

// TEST3 //
var s2 = window.performance.now();

for(var z = 0; z < 100; z++) {
	var c = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
	var collided = c < (r1 + r2);
}

var e2 = window.performance.now();

console.log("TEST3 = Speed: " + (e2 - s2) + " ms");*/