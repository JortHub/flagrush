var canvas = document.getElementById('cvs');
var minimap_canvas = document.getElementById('minimap-canvas');
var ctx = canvas.getContext("2d");
var minimap_ctx = minimap_canvas.getContext("2d");
minimap_ctx.imageSmoothingEnabled = true;
minimap_ctx.imageSmoothingQuality = "medium";
var restarts = 0;

var main = io();
var server = null;
var loc = null;
var ping = 0;

var mapSize = 25000;

var viewport = new viewport_(canvas, 0.2);
var gameloop = new gameloop_(update, tick);
var input = new input_();
var camera = new camera_(canvas, viewport);
var leaderboard = new leaderboard_();
var startTime;

var img_manager = new img_manager_();
var spaceship_body_blue = img_manager.add("spaceship_body_blue", "../gfx/spaceship_body_blue.png");
var spaceship_body_red = img_manager.add("spaceship_body_red", "../gfx/spaceship_body_red.png");
var spaceship_body_white = img_manager.add("spaceship_body_white", "../gfx/spaceship_body_white.png");
var spaceship_trail = img_manager.add("spaceship_trail", "../gfx/spaceship_trail.png");
var spaceship_wings = img_manager.add("spaceship_wings", "../gfx/spaceship_wings.png");
var spaceship_turrets = img_manager.add("spaceship_turrets", "../gfx/spaceship_turrets.png");
var spaceship_hurt = img_manager.add("spaceship_hurt", "../gfx/spaceship_hurt.png");
var spaceship_laser1 = img_manager.add("spaceship_laser1", "../gfx/spaceship_laser1.png");
var spaceship_laser2 = img_manager.add("spaceship_laser2", "../gfx/spaceship_laser2.png");
var spaceship_laser3 = img_manager.add("spaceship_laser3", "../gfx/spaceship_laser3.png");
var spaceship_laser4 = img_manager.add("spaceship_laser4", "../gfx/spaceship_laser4.png");
var spaceship_boosters = img_manager.add("spaceship_boosters", "../gfx/spaceship_boosters.png");
var main_flag = img_manager.add("main_flag", "../gfx/main_flag.png");
var arrow_white = img_manager.add("arrow_white", "../gfx/arrow_white.png");
var arrow_blue = img_manager.add("arrow_blue", "../gfx/arrow_blue.png");
var arrow_red = img_manager.add("arrow_red", "../gfx/arrow_red.png");
var flag_small = img_manager.add("flag_small", "../gfx/flag_small.png");
var home_small = img_manager.add("home_small", "../gfx/home_small.png");
var fuel_tank = img_manager.add("fuel_tank", "../gfx/fuel_tank.png");
var fuel_small = img_manager.add("fuel_small", "../gfx/fuel_small.png");
img_manager.load();

var players = [];
var fuel_tanks = [];
var me = null;
var started = false;
var flagPlayer = null;
var mouseX = 0;
var mouseY = 0;
var mouseInScreen = true;

var statrows = {
	speed: new statrow(document.getElementById("speed")),
	regen: new statrow(document.getElementById("regen")),
	damage: new statrow(document.getElementById("damage")),
	boost: new statrow(document.getElementById("boost")),
	health: new statrow(document.getElementById("health")),
	heat: new statrow(document.getElementById("heat"))
};
var upgrades = new upgrades_(statrows, upgrade);

window.onerror = function (msg, url, lineNo, columnNo, error) {
	restart("There was an error<br /><small>" + msg + "</small>", 5000);
}

var hints = ["Get points for killing other players and use them for upgrades.",
			 "Follow the ingame instructions to know what you have to do.",
			 "Use the minimap for directions so you dont get lost.",
			 "Collect the boost tanks to refill your boost.",
			 "You can change the controls to WASD in the settings.",
			 "Defenders lose health when they go into the safezone.",
			 "The bar you see on players is their health.",
			 "For the quality setting to work you need smooth to be turned on.",
			 "If there are no defenders online, you cant capture the flag.",
			 "Attackers cant get shot when they are in the safe zone."];

var main_canvas = document.getElementById('main-cvs');
var main_ctx = main_canvas.getContext('2d');
var small_spaceship = new img("small_spaceship", "../gfx/small_spaceship.png");
small_spaceship.load();
function generate_mainCanvas() {
	main_canvas.width = window.innerWidth;
	main_canvas.height = window.innerHeight;

	main_ctx.fillStyle = "#FFFFFF";
	for(var i = 0; i < 30; i++) {
		main_ctx.fillRect(
			Math.round(Math.random() * main_canvas.width),
			Math.round(Math.random() * main_canvas.height),
			2, 2
		);
	}

	main_ctx.translate(
		Math.round(Math.random() * main_canvas.width), 
		Math.round((Math.random() * (main_canvas.height / 2)) + (main_canvas.height / 2))
	);
	main_ctx.rotate(
		Math.round((Math.random() * 360) * Math.PI / 180)
	);
	main_ctx.drawImage(
		small_spaceship.img, 
		Math.round(-(small_spaceship.oWidth / 2)), 
		Math.round(-(small_spaceship.oHeight / 2)),
		small_spaceship.oWidth,
		small_spaceship.oHeight
	);
}

waitForMainCanvas();

function waitForMainCanvas() {
	setTimeout(function() {
		if(small_spaceship.loaded) {
			generate_mainCanvas();
		}	
		else {
			waitForMainCanvas();
		}
	}, 50);
}

window.onresize = function() {
	if(!started) {
		generate_mainCanvas();
	}
	viewport.resize();
}

function load() {
	if(restarts % 2 != 0) {
		adplayer.startPreRoll();
	}
	else {
		load_after_ad();
	}
}

document.getElementById("username").addEventListener('keydown', function() {
	if(!started && event.keyCode == 13) {
		load();
	}	
});

var use_mouse = true;
var settings = new settings_();

if(typeof(Storage) !== "undefined") {
	if(localStorage.getItem("username") != null) {
		document.getElementById('username').value = localStorage.getItem("username");
	}
}

var stars = [];

init_main();

verifyAdblocker();

function verifyAdblocker() {
	var test = document.createElement('div');
	test.innerHTML = '&nbsp;';
	test.className = 'adsbox';
	document.body.appendChild(test);
	window.setTimeout(function() {
		if(test.offsetHeight === 0) {
			var buttons = document.getElementsByClassName("upgrade");

			for(var n in buttons) {
				buttons[n].className = "upgrade adblocker";
			}
		}
		test.remove();
	}, 100);
}

function generate_stars() {
	if(me == null) {
		return;
	}

	if(stars.length == 0) {
		for(var i = 0; i < 40; i++) {
			stars[i] = {x: me.x - (Math.random() * 8000) + 4000, y: me.y - (Math.random() * 8000) + 4000};
		}
	}
	else {
		for(var i = 0; i < stars.length; i++) {
			var star = stars[i];
			if(star.x < me.x-4000 || star.x > me.x+4000 || star.y < me.y-4000 || star.y > me.y+4000) {
				var n = Math.round(Math.random() * 3);

				if(n == 0) {
					stars[i] = {x: me.x - (Math.random() * 6000) + 3000, y: me.y - 3000};
				}
				else if(n == 1) {
					stars[i] = {x: me.x - (Math.random() * 6000) + 3000, y: me.y + 3000};
				}
				else if(n == 2) {
					stars[i] = {x: me.x - 3000, y: me.y - (Math.random() * 6000) + 3000};
				}
				else {
					stars[i] = {x: me.x + 3000, y: me.y - (Math.random() * 6000) + 3000};
				}
			}
		}
	}
}

var time_left = 0;
var start_date = 0;

function broadcast(code, message) {
	main.emit("broadcast", code, message);
}

function init_main() {
	main.on("server" , function(arg) {
		if(arg != null) {
			server = io(arg.ip);
			loc = arg.loc;
		}
		else {
			server = main;
			loc = "Main";
		}

		init_server();
	});

	main.on("broadcast", function(message) {
		var old = document.getElementById("game-text-sub").innerHTML;
		document.getElementById("game-text-sub").innerHTML = message;

		setTimeout(function() {
			if(document.getElementById("game-text-sub").innerHTML == message) {
				document.getElementById("game-text-sub").innerHTML = old;
			}
		}, 3000);
	});

	main.on("disconnect", function(reason) {
		if(reason.includes("transport")) {
			setTimeout(function() {
				close();
				exit();
			}, 1000);
			return;
		}

		close();

		if(started) {
			setTimeout(function() {
				exit();
			}, 1000);
		}
	});

	window.onunload = function(){
		close();
	};
}

function init_server() {
	server.on("joined", function(name) {
		console.log("Joined (" + new Date().toLocaleTimeString() + ")");
		me = new player();
		me.name = name;
		players[players.length] = me;
	});

	server.on("spawn", function(name, x, y, r, team) {
		if(name != me.name) {
			console.log("Player " + name + "(" + team + ") joined");

			var p = new player();
			p.name = name;
			p.x = x;
			p.y = y;
			p.setR(r);
			p.team = team;
			players[players.length] = p;
		}
		else {
			me.x = x;
			me.y = y;
			me.r = r;
			me.setR(r);
			me.team = team;

			generate_stars();

			if(me.team == 0) {
				document.getElementById("game-text-title").innerHTML = "Capture the flag";
			}
			else {
				document.getElementById("game-text-title").innerHTML = "Defend the flag";
			}
		}
	});

	server.on("leave", function(name) {
		console.log("Player " + name + " left");

		removePlayer(name);
	});

	server.on("boost", function(name) {
		var p = getPlayer(name);
		p.boosting = true;
		p.boostTimer = 0;
		p.shooting = false;
	});

	server.on("move", function(name, x, y, r, state) {
		var p = getPlayer(name);

		if(!state) {
			p.moving = false;
			p.rotating = false;
			return;
		}
		else {
			if(Math.round(p.oldX) != Math.round(x) || Math.round(p.oldY) != Math.round(y)) {
				p.moving = true;
			}

			if(Math.round(p.oldR) != Math.round(r)) {
				p.rotating = true;
			}
		}

		if(p == me) {
			p.x = x;
			p.y = y;
			p.oldX = x;
			p.oldY = y;
		}
		else {
			p.setX(x);
			p.setY(y);
		}
		
		p.setR(r);
	});

	server.on("fuel_spawn", function(x, y, r, fuel) {
		fuel_tanks[fuel_tanks.length] = {x: x, y: y, r: r, fuel: fuel};
	});

	server.on("fuel_remove", function(x, y) {
		for(var n in fuel_tanks) {
			if(fuel_tanks[n].x == x && fuel_tanks[n].y == y) {
				fuel_tanks.splice(n, 1);
			}
		}
	});

	server.on("stat", function(name, value) {
		if(name == "health") {
			statrows.health.set(value);
		}
		else if(name == "heat") {
			statrows.heat.set(value);
		}
		else {
			statrows.boost.set(value);
		}
	});

	server.on("health", function(player, value) {
		getPlayer(player).health = value;
	});

	server.on("killed", function(killed, killer) {
		if(killed == me.name) {
			restart("You were killed by<br /><i>" + killer + "</i>", 4000);
		}
		else {
			if(getPlayer(killer) != null) {
				getPlayer(killer).kills++;
			}
		}

		if(killed != me.name && killer == me.name) {
			upgrades.points++;
			upgrades.upgrade();
		}
	});

	server.on("hit", function(player) {
		var p = getPlayer(player);
		p.hit = true;
		p.hitTimer = 0;
		p.hitAlpha = 0;
	});

	server.on("shoot", function(player, turret) {
		var p = getPlayer(player);
		p.shooting = true;
		p.shotTimer = 0;
		p.turret = turret;
		p.boosting = false;
	});

	server.on("state", function(message) {
		document.getElementById("game-text-title").innerHTML = message;
	});

	server.on("message", function(message) {
		if(message == document.getElementById("game-text-sub").innerHTML ||
			document.getElementById("game-text-sub").innerHTML != null) {
			return;
		}
		document.getElementById("game-text-sub").innerHTML = message;
		setTimeout(function() {
			if(document.getElementById("game-text-sub").innerHTML == message) {
				document.getElementById("game-text-sub").innerHTML = "";
			}
		}, 3000);
	});

	server.on("wait", function(state) {
		if(state && document.getElementById("game-text-sub").innerHTML != null) {
			document.getElementById("game-text-sub").innerHTML = "Wait until there are defenders";
		}
		else if(document.getElementById("game-text-sub").innerHTML == "Wait until there are defenders")  {
			document.getElementById("game-text-sub").innerHTML = "";
		}
	});

	server.on("kills", function(player, kills) {
		var p = getPlayer(player);
		p.kills = kills;
	});

	server.on("capturing", function(state, name, time) {
		if(state) {
			if(name == me.name) {
				time_left = time * 100;
				start_date = Date.now();
				document.getElementById("game-text-title").innerHTML = "Capturing the flag<br>" + Math.round(time_left/1000) + " seconds left";
			}
			else {
				document.getElementById("game-text-title").innerHTML = "The flag is being captured";
			}
		}
		else {
			time_left = 0;

			if(me.team == 0) {
				document.getElementById("game-text-title").innerHTML = "Capture the flag";
			}
			else {
				document.getElementById("game-text-title").innerHTML = "Defend the flag";
			}
		}
	});

	server.on("captured", function(name, state) {
		var title = document.getElementById("game-text-title");

		if(state) {
			if(me.team == 0) {
				if(me.name == name) {
					title.innerHTML = "Get the flag to the safe-zone";
				}
				else {
					title.innerHTML = name + " has the flag";
				}
			}
			else {
				title.innerHTML = "Get our flag back";
			}
			flagPlayer = name;
		}
		else {
			if(me.team == 0) {
				title.innerHTML = "You lost the flag";

				setTimeout(function() {
					if(title.innerHTML == "You lost the flag") {
						title.innerHTML = "Capture the flag"
					}	
				}, 2000);
			}
			else {
				title.innerHTML = "The flag was returned";

				setTimeout(function() {
					if(title.innerHTML == "The flag was returned") {
						title.innerHTML = "Defend the flag";
					}	
				}, 2000);
			}
			flagPlayer = null;
		}
		var p = getPlayer(name);

		flagCaptured = state;

		if(p != null) {
			p.flagTime = 0;
		}
	});

	server.on("disconnect", function() {
		console.log("Left (" + new Date().toLocaleTimeString() + ")");
		server.close();
	});

	server.on("finished", function() {
		restart("The attackers<br>have won the game", 5000);
	});

	server.on("kicked", function(reason) {
		restart("You were kicked<br /><small>" + reason + "</small>");
	});
}

function getPlayer(name) {
	for(var i = 0; i < players.length; i++) {
	    if(players[i].name == name) {
	        return players[i];
	    }
	}
}

function removePlayer(name) {
	for(var i = 0; i < players.length; i++) {
	    if(players[i].name == name) {
	        players.splice(i, 1);
	        break;
	    }
	}
}

var restarting = false;

function load_after_ad() {
	username = document.getElementById('username').value;
	
	var titleMenu = document.getElementById('title');
	titleMenu.innerHTML = "<span>Loading...<div class='hint'>" + hints[Math.floor(hints.length * Math.random())] + "</div></span>";
	titleMenu.className = "active";
	titleMenu.style.zIndex = "10";

	init();

	setTimeout(function() {
		start_when_loaded();
	}, 5000);
}

function restart(reason, length) {
	length = length || 2000;

	if(restarting) {
		return;
	}

	restarts++;

	restarting = true;
	started = false;

	main.disconnect();
	main.close();
	if(server != null) {
		server.disconnect();
		server.close();
		server = null;
	}

	var titleMenu = document.getElementById('title');
	var mainMenu = document.getElementById('main');
	var gameMenu = document.getElementById('game');
	titleMenu.innerHTML = "<span>" + reason + "</span>";
	titleMenu.className = "active";
	titleMenu.style.zIndex = "10";

	setTimeout(function() {
		mainMenu.style.display = "initial";
		gameMenu.style.display = "none";
		titleMenu.className = "inactive";

		viewport = new viewport_(canvas, 0.2);
		gameloop.running = false;
		gameloop = new gameloop_(update, tick);
		input = new input_();
		camera = new camera_(canvas, viewport);
		leaderboard = new leaderboard_();
		settings = new settings_();
		flagPlayer = null;
		time_left = 0;
		generate_mainCanvas();

		statrows = {
			speed: new statrow(document.getElementById("speed")),
			regen: new statrow(document.getElementById("regen")),
			damage: new statrow(document.getElementById("damage")),
			boost: new statrow(document.getElementById("boost")),
			health: new statrow(document.getElementById("health")),
			heat: new statrow(document.getElementById("heat"))
		};

		players = [];
		fuel_tanks = [];
		me = null;

		loc = null;
		ping = 0;

		main = io({forceNew: true});
		init_main();

		setTimeout(function() {
			titleMenu.style.zIndex = "-5";
			restarting = false;
		}, 1000);
	}, length);
}

function close() {
	main.disconnect();
	main.close();
	if(server != null) {
		server.disconnect();
		server.close();
	}

	settings.save();
}

function exit() {
	location.reload();
}

document.getElementById('enter').onclick = function() {
	load();
}

function start_when_loaded() {
	if(!img_manager.loaded()) {
		window.setTimeout(start_when_loaded, 500);
	}
	else {
		if(restarting) {
			return;
		}

		document.getElementById('main').style.display = "none";
		document.getElementById('game').style.display = "initial";
		document.getElementById('title').className = "inactive";

		setTimeout(function() {
			if(started) {
				document.getElementById('title').style.zIndex = "-5";
			}
		}, 500);

		start(username);
	}
}

function init() {
	main.emit("server");

	statrows.speed.fill();
	statrows.regen.fill();
	statrows.damage.fill();
	statrows.boost.fill();
	statrows.health.fill();
	statrows.heat.fill(true);
}

function start(username) {
	document.getElementById('loc').innerHTML = loc;

	if(typeof(Storage) !== "undefined") {
		localStorage.setItem("username", username);
	}

	settings.load();

	server.emit("join", username);

	started = true;
	gameloop.start();
}

var flagX = 12000;
var flagY = 2500;
var flagW = 1000;
var flagH = 1000;
var szX = 7500;
var szY = 23000;
var szW = 10000;
var szH = 2000;
var flagCaptured = false;

function calcMinimap(n) {
	return Math.round(n * 200 / mapSize);
}

var minimapAniTime = 0;

function update() {
	ctx.fillStyle = "#00001e";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	if(document.getElementById("game-text-title").innerHTML.startsWith("Capturing the flag")) {
		time_left = 10000 - (Date.now() - start_date);
		document.getElementById("game-text-title").innerHTML = "Capturing the flag<br>" + Math.round(time_left/1000) + " seconds left";
	}

	if(me != null) {
		camera.setX(me.x);
		camera.setY(me.y);
		camera.update();

		if(document.getElementById("square-minimap").className != "inactive") {
			minimap_ctx.fillStyle = "#00001e";
			minimap_ctx.fillRect(0, 0, minimap_canvas.width, minimap_canvas.height);

			if(me.team == 0) {
				minimap_ctx.fillStyle = "#FF7F7F";

				minimap_ctx.fillRect(calcMinimap(flagX) - 10, calcMinimap(flagY) - 10, calcMinimap(flagW) + 20, calcMinimap(flagH) + 20);
				minimap_ctx.beginPath();
				minimap_ctx.strokeStyle = "#FF0000";
				minimap_ctx.lineWidth = "1";
				minimap_ctx.rect(calcMinimap(flagX) - 10, calcMinimap(flagY) - 10, calcMinimap(flagW) + 20, calcMinimap(flagH) + 20);
				minimap_ctx.stroke();

				minimap_ctx.fillStyle = "#7F92FF";
				minimap_ctx.fillRect(calcMinimap(szX) - 10, calcMinimap(szY) - 10, calcMinimap(szW) + 20, calcMinimap(szH) + 10);
				minimap_ctx.beginPath();
				minimap_ctx.strokeStyle = "#0026FF";
				minimap_ctx.lineWidth = "1";
				minimap_ctx.rect(calcMinimap(szX) - 10, calcMinimap(szY) - 10, calcMinimap(szW) + 20, calcMinimap(szH) + 10);
				minimap_ctx.stroke();
			}
			else {
				minimap_ctx.fillStyle = "#7F92FF";
				minimap_ctx.fillRect(calcMinimap(flagX) - 10, calcMinimap(flagY) - 10, calcMinimap(flagW) + 20, calcMinimap(flagH) + 20);
				minimap_ctx.beginPath();
				minimap_ctx.strokeStyle = "#0026FF";
				minimap_ctx.lineWidth = "1";
				minimap_ctx.rect(calcMinimap(flagX) - 10, calcMinimap(flagY) - 10, calcMinimap(flagW) + 20, calcMinimap(flagH) + 20);
				minimap_ctx.stroke();

				minimap_ctx.fillStyle = "#FF7F7F";
				minimap_ctx.fillRect(calcMinimap(szX) - 10, calcMinimap(szY) - 10, calcMinimap(szW) + 20, calcMinimap(szH) + 10);
				minimap_ctx.beginPath();
				minimap_ctx.strokeStyle = "#FF0000";
				minimap_ctx.lineWidth = "1";
				minimap_ctx.rect(calcMinimap(szX) - 10, calcMinimap(szY) - 10, calcMinimap(szW) + 20, calcMinimap(szH) + 10);
				minimap_ctx.stroke();
			}

			if(!flagCaptured && time_left != 0) {
				if(minimapAniTime > 60) {
					minimap_ctx.drawImage(flag_small.img, calcMinimap(flagX) - 5, calcMinimap(flagY) - 5, calcMinimap(flagW) + 10, calcMinimap(flagH) + 10);
				}

				minimapAniTime++;
				if(minimapAniTime > 120) {
					minimapAniTime = 0;
				}
			}
			else if(!flagCaptured) {
				minimap_ctx.drawImage(flag_small.img, calcMinimap(flagX) - 5, calcMinimap(flagY) - 5, calcMinimap(flagW) + 10, calcMinimap(flagH) + 10);
			}
			
			if(me.team == 0) {
				minimap_ctx.drawImage(home_small.img, 90, 182, 20, 20);
			}

			for(var n in players) {
				var p = players[n];
				minimap_ctx.save();
				minimap_ctx.translate(calcMinimap(p.x), calcMinimap(p.y));
				minimap_ctx.rotate(p.r * Math.PI / 180);

				if(p.name == flagPlayer) {
					if(p.flagTime >= 0) {
						minimap_ctx.drawImage(flag_small.img, -7, -7, 14, 14);

						p.flagTime++;
						if(p.flagTime == 30) {
							p.flagTime = -1;
						}
						minimap_ctx.restore();
						continue;
					}
					else {
						p.flagTime--;
						if(p.flagTime == -32) {
							p.flagTime = 0;
						}
					}
				}

				if(p == me) {
					minimap_ctx.drawImage(arrow_white.img, -6, -6, 12, 12);
				}
				else if(p.team == me.team) {
					minimap_ctx.drawImage(arrow_blue.img, -6, -6, 12, 12);
				}
				else {
					minimap_ctx.drawImage(arrow_red.img, -6, -6, 12, 12);
				}
				minimap_ctx.restore();
			}
		}

		ctx.fillStyle = "#FFFFFF";
		for(var i = 0; i < stars.length; i++) {
			var star = stars[i];
			if(star.x > (me.x - 3000) || star.x < (me.x + 3000) ||
			   star.y > (me.y - 3000) || star.y < (me.y + 3000)) {
				ctx.fillRect(camera.calcX(star.x), camera.calcY(star.y), camera.calc(10), camera.calc(10));
			}
		}

		ctx.fillStyle = "#000000";
		ctx.fillRect(camera.calcX(-3000), camera.calcY(-3000), camera.calc(3000), camera.calc(mapSize + 6000));
		ctx.fillRect(camera.calcX(-3000), camera.calcY(-3000), camera.calc(mapSize + 6000), camera.calc(3000));
		ctx.fillRect(camera.calcX(mapSize), camera.calcY(-3000), camera.calc(3000), camera.calc(mapSize + 6000));
		ctx.fillRect(camera.calcX(-3000), camera.calcY(mapSize), camera.calc(mapSize + 6000), camera.calc(3000));

		if(me.team == 0) {
			ctx.fillStyle = "#FF7F7F";
			ctx.fillRect(camera.calcX(flagX), camera.calcY(flagY), camera.calc(flagW), camera.calc(flagH));
			ctx.beginPath();
			ctx.strokeStyle = "#FF0000";
			ctx.lineWidth = camera.calc(30) + "";
			ctx.rect(camera.calcX(flagX), camera.calcY(flagY), camera.calc(flagW), camera.calc(flagH));
			ctx.stroke();

			ctx.fillStyle = "#7F92FF";
			ctx.fillRect(camera.calcX(szX), camera.calcY(szY), camera.calc(szW), camera.calc(szH));
			ctx.beginPath();
			ctx.strokeStyle = "#0026FF";
			ctx.lineWidth = camera.calc(30) + "";
			ctx.rect(camera.calcX(szX), camera.calcY(szY), camera.calc(szW), camera.calc(szH));
			ctx.stroke();
		}
		else {
			ctx.fillStyle = "#7F92FF";
			ctx.fillRect(camera.calcX(flagX), camera.calcY(flagY), camera.calc(flagW), camera.calc(flagH));
			ctx.beginPath();
			ctx.strokeStyle = "#0026FF";
			ctx.lineWidth = camera.calc(30) + "";
			ctx.rect(camera.calcX(flagX), camera.calcY(flagY), camera.calc(flagW), camera.calc(flagH));
			ctx.stroke();

			ctx.fillStyle = "#FF7F7F";
			ctx.fillRect(camera.calcX(szX), camera.calcY(szY), camera.calc(szW), camera.calc(szH));
			ctx.beginPath();
			ctx.strokeStyle = "#FF0000";
			ctx.lineWidth = camera.calc(30) + "";
			ctx.rect(camera.calcX(szX), camera.calcY(szY), camera.calc(szW), camera.calc(szH));
			ctx.stroke();
		}

		if((flagX > (me.x - 3000) || flagX < (me.x + 3000) ||
		   flagY > (me.y - 3000) || flagY < (me.y + 3000)) &&
		   !flagCaptured) {
			ctx.drawImage(main_flag.img, camera.calcX(flagX), camera.calcY(flagY), camera.calc(1000), camera.calc(1000));
		}

		for(var n in fuel_tanks) {
			ctx.save();

			var tank = fuel_tanks[n];
			if (tank.x < (me.x - 3000) || tank.x > (me.x + 3000) ||
				tank.y < (me.y - 3000) || tank.y > (me.y + 3000)) {
				continue;
			}
			ctx.translate(camera.calcX(tank.x), camera.calcY(tank.y));
			ctx.rotate(tank.r * Math.PI / 180);

			ctx.drawImage(fuel_tank.img, camera.calc(-66), camera.calc(-219), camera.calc(133), camera.calc(438));

			if(tank.fuel <= 5) {
				ctx.fillStyle = "rgb(255, " + (255 * (tank.fuel / 5)) + ", 0)";
			}
			else {
				ctx.fillStyle = "rgb(" + (255 - (255 * ((tank.fuel - 5) / 5))) + ", 255, 0)";
			}

			for(var i = 0; i < tank.fuel; i++) {
				ctx.fillRect(camera.calc(-11), camera.calc(152 - 14 * i), camera.calc(22), camera.calc(11));
			}
			ctx.restore();
		}
	}

	for(var n in players) {
		ctx.save();

		var p = players[n];
		p.update();

		if (p.x < (me.x - 3000) || p.x > (me.x + 3000) ||
			p.y < (me.y - 3000) || p.y > (me.y + 3000)) {
			continue;
		}

		if(p == me) {
			ctx.translate(camera.middleX(), camera.middleY());
		}
		else {
			ctx.translate(camera.calcX(p.x), camera.calcY(p.y));
		}

		ctx.rotate(p.r * Math.PI / 180);

		var x = camera.calc(-400);
		var y = camera.calc(-620);
		var w = camera.calc(800);
		var h = camera.calc(1000);

		if(p == me) {
			ctx.drawImage(spaceship_body_white.img, x, y, w, h);
		}
		else if(p.team == me.team) {
			ctx.drawImage(spaceship_body_blue.img, x, y, w, h);
		}
		else {
			ctx.drawImage(spaceship_body_red.img, x, y, w, h);
		}
		
		if(p.boosting) {
			ctx.drawImage(spaceship_boosters.img, x, y, w, h);

			p.boostTimer++;

			if(p.boostTimer == 10) {
				p.boosting = false;
			}
		}
		else {
			ctx.drawImage(spaceship_turrets.img, x, y, w, h);
		}

		if(p.shooting) {
			if(p.turret == 0) {
				ctx.drawImage(spaceship_laser1.img, x, y, w, h);
			}
			else if(p.turret == 1) {
				ctx.drawImage(spaceship_laser2.img, x, y, w, h);
			}
			else if(p.turret == 2) {
				ctx.drawImage(spaceship_laser3.img, x, y, w, h);
			}
			else {
				ctx.drawImage(spaceship_laser4.img, x, y, w, h);
			}

			p.shotTimer++;

			if(p.shotTimer == 10) {
				p.shooting = false;
			}
		}

		ctx.drawImage(spaceship_wings.img, x, y, w, h);

		if(p.hit) {
			if(p.hitTimer < 10) {
				p.hitAlpha += 0.03;
				ctx.globalAlpha = p.hitAlpha;
			}
			else if(p.hitTimer >= 10 && p.hitTimer < 20) {
				p.hitAlpha -= 0.03;
				ctx.globalAlpha = p.hitAlpha;
			}
			else if(p.hitTimer == 20) {
				ctx.globalAlpha = 0;
				p.hit = false;
			}

			ctx.drawImage(spaceship_hurt.img, x, y, w, h);

			ctx.globalAlpha = 1;

			p.hitTimer++;
		}

		if(p.health <= 7) {
			ctx.fillStyle = "rgb(255, " + Math.round(255 * (p.health / 7)) + ", 0)";
		}
		else {
			ctx.fillStyle = "rgb(" + Math.round(255 - (255 * ((p.health - 7) / 8))) + ", 255, 0)";
		}

		if(p != me) {
			ctx.fillRect(camera.calc(-22), camera.calc(-138 + (16.5 * (15 - p.health))), camera.calc(40), camera.calc(16.5 * p.health));
		}

		if(flagPlayer == p.name && p != me) {
			ctx.drawImage(main_flag.img, camera.calc(-150), camera.calc(-430), camera.calc(300), camera.calc(300));
		}

		if(p.moving) {
			ctx.drawImage(spaceship_trail.img, x, y, w, h);
		}

		ctx.restore();
	}
}

var lastTarget = -1;

function tick() {
	leaderboard.update(players, me);
	generate_stars();

	if(mouseInScreen && use_mouse) {
		var c = Math.round(Math.atan2(camera.middleX() - mouseX, camera.middleY() - mouseY) * 180 / Math.PI);
		if(c < 0) {
			c = -c;
		}
		else {
			c = 360 - c;
		}

		if(lastTarget != c) {
			onInput("target", c);
			lastTarget = c;
		}
	}
}

function onInput(button, state) {
	if(server != null && started) {
		server.emit("input", button, state);
	}
}

function upgrade(g) {
	if(server != null) {
		server.emit("upgrade", g);
	}
}