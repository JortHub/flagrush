var canvas = document.getElementById('cvs');
var ctx = canvas.getContext("2d");
var gui = document.getElementById('gui');
var view = new viewport(canvas);
var gameloop = new gameloop(update);
var input = new input_(onInput);
var camera = new camera_(canvas, view);
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
	ctx.fillStyle = "#000019";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

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
		ctx.fillStyle = "#FFFFFF";
		ctx.fillRect(camera.calc(-100 / 2), camera.calc(-100 / 2), camera.calc(100), camera.calc(100));

		ctx.strokeStyle = "#00ad02";
		ctx.beginPath();
		ctx.arc(0, 0, camera.calc(50), 0, 2 * Math.PI);
		ctx.stroke();

		ctx.restore();
	}
}

function onInput(button, state) {
	if(server != null) {
		server.emit("input", button, state);
	}
}

fill(document.getElementById("health"));
fill(document.getElementById("boost"));
fillHeat(document.getElementById("heat"));

function fill(items) {
	for(var i = 0; i < 15; i++) {
		var el = document.createElement('div');
		el.style.borderColor = items.getAttribute("color");
		el.style.background = items.getAttribute("color");

		if(i < 10) {
			el.className = "item active";
		}
		else {
			el.className = "item inactive";
		}

		items.appendChild(el);
	}
}

function fillHeat(items) {
	for(var i = 0; i < 15; i++) {
		var el = document.createElement('div');
		el.style.borderColor = "rgb(255, " + (255 - ((255 / 15) * i)) + ", 0)";
		el.style.background = "rgb(255, " + (255 - ((255 / 15) * i)) + ", 0)";

		if(i < 0) {
			el.className = "item active";
		}
		else {
			el.className = "item inactive";
		}

		items.appendChild(el);
	}
}