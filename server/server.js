module.exports = function(io) {
	var namegenerator = require('./namegenerator')();
	var player = require('./player');
	var gameloop = require('./gameloop');
	var collide = require('line-circle-collision');

	var self = {}

	self.players = [];
	self.maxR = 12;
	self.maxM = 90;
	self.minR = 0;
	self.minM = 0;
	self.accM = 3;
	self.decM = 2;
	self.accR = 0.6;
	self.decR = 1.2;
	self.bufM = 0.2;
	self.bufR = 0.4;
	self.mapSize = 20000;
	self.boostM = 120;
	self.teams = [0, 0];
	self.attackers = 0;
	self.defenders = 1;
	self.capturing = false;
	self.maxCaptureTime = 300;
	self.captureTime = self.maxCaptureTime;
	self.onFlag = false;
	self.capturingPlayer = null;
	self.flagPlayer = null;
	self.flagX = 9500;
	self.flagY = 2000;
	self.flagW = 1000;
	self.flagH = 1000;
	self.szX = 5000;
	self.szY = 18000;
	self.szW = 10000;
	self.szH = 2000;
	self.restarting = false;
	self.bulletDistance = 2000;
	self.maxWaitTime = 9000;
	self.rotationLoss = 0.5;
	self.deg = Math.PI / 180;
	self.circle = 360;
	self.extraR = 90;
	self.fueltanks = [];

	self.fuelTank = function() {
		var s = {};
		s.x = 0;
		s.y = 0;
		s.z = 0;
		s.radius = 100;
		s.fuel = Math.round(Math.random() * 7) + 3;

		s.spawn = function() {
			s.x = Math.random() * self.mapSize;
			s.y = Math.random() * self.mapSize;
			s.r = Math.random() * 360;

			for(var i in self.players) {
				var check = self.players[i];

				var dx = s.x - check.x;
				var dy = s.y - check.y;

				if(Math.sqrt(dx * dx + dy * dy) <= s.radius + check.radius) {
					s.spawn();
					return;
				}
			}

			for(var n in self.players) {
				self.players[n].socket.emit("fuel_spawn", s.x, s.y, s.r, s.fuel);
			}
		}

		return s;
	}

	self.getPlayer = function(socket) {
		for(var n in self.players) {
			if(socket.id == self.players[n].socket.id) {
				return self.players[n];
			}
		}
	}

	self.round = function(value, decimals) {
		return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
	}

	self.collidingRect = function(player, rect) {
		var distX = Math.abs(player.x - rect[0] - rect[2] / 2);
	    var distY = Math.abs(player.y - rect[1] - rect[3] / 2);

	    if (distX > (rect[2] / 2 + player.radius)) {
	        return false;
	    }
	    if (distY > (rect[3] / 2 + player.radius)) {
	        return false;
	    }

	    if (distX <= (rect[2] / 2)) {
	        return true;
	    }
	    if (distY <= (rect[3] / 2)) {
	        return true;
	    }

	    var dx = distX - rect[2] / 2;
	    var dy = distY - rect[3] / 2;
	    return (dx * dx + dy * dy <= (player.radius * player.radius));
	}

	self.teamPicker = function() {
		if(self.teams[self.attackers] > self.teams[self.defenders]) {
			self.teams[self.defenders]++;
			return self.defenders;
		}
		else if(self.teams[self.attackers] == self.teams[self.defenders]) {
			var n = Math.round(Math.random());
			self.teams[n]++;
			return n;
		}
		else {
			self.teams[self.attackers]++;
			return self.attackers;
		}
	}

	self.update = function() {
		if(self.players.length <= 0) {
			return;
		}

		for(var i = self.fueltanks.length; i < 3; i++) {
			var tank = new self.fuelTank();
			tank.spawn();
			self.fueltanks[i] = tank;
		}
	
		// Update the forces and so the player's locations
		for(var n in self.players) {
			var player = self.players[n];

			player.waitTime++;

			if(player.waitTime > self.maxWaitTime) {
				player.socket.disconnect();
				continue;
			}

			var moved = false;
			var rotated = false;


			if(player.isHold(32) && !player.knockback && player.boost > 0) {
				player.boosting(self.players, self.boostM);
			}
			else if(player.isHold(87) && !player.knockback) {
				player.addForce(10, 0);
				player.speedM += self.accM;

				if(player.speedM >= (self.maxM - self.bufM)) {
					player.speedM = self.maxM;
				}

				player.isBoosting = false;
			}
			else if(player.isHold(83) && !player.knockback) {
				player.addForce(-10, 0);
				player.speedM += self.accM;

				if(player.speedM >= (self.maxM - self.bufM)) {
					player.speedM = self.maxM;
				}

				player.isBoosting = false;
			}
			else {
				if(player.speedM <= (self.minM + self.bufM)) {
					player.speedM = self.minM;
					player.forceM = self.minM;
				}
				else {
					player.speedM -= self.decM;
				}

				player.isBoosting = false;
			}

			if(player.isHold(65)) {
				if(player.forceR > 0) {
					player.speedR = player.speedR * self.rotationLoss;
					player.forceR = 0;
				}

				player.addForce(0, -10);
				player.speedR += self.accR;

				if(player.speedR >= (self.maxR - self.bufR)) {
					player.speedR = self.maxR;
				}

				rotated = true;
			}
			
			if(player.isHold(68)) {
				if(player.forceR < 0) {
					player.speedR = player.speedR * self.rotationLoss;
					player.forceR = 0;
				}

				player.addForce(0, 10);
				player.speedR += self.accR;

				if(player.speedR >= (self.maxR - self.bufR)) {
					player.speedR = self.maxR;
				}

				rotated = true;
			}

			if(!rotated) {
				if(player.speedR <= (self.minR + self.bufR)) {
					player.speedR = self.minR;
					player.forceR = self.minR;
				}
				else {
					player.speedR -= self.decR;
				}
			}

		}

		for(var n in self.players) {
			var player = self.players[n];

			if(player.forceR > 0) {
				player.r += player.speedR;
			}
			else if(player.forceR < 0) {
				player.r -= player.speedR;
			}

			if(player.r > self.circle) {
				player.r -= self.circle;
			} 
			else if(player.r < 0) {
				player.r += self.circle;
			}

			var moveX = 0;
			var moveY = 0;

			if(player.knockback) {
				moveX = player.speedM * Math.cos((player.knockbackR - self.extraR) * self.deg);
				moveY = player.speedM * Math.sin((player.knockbackR - self.extraR) * self.deg);

				player.knockbackStep--;

				if(player.knockbackStep == 0) {
					player.knockback = false;
				}
			}
			else {
				if(player.forceM > 0) {
					moveX = player.speedM * ((player.speed / 2) + 1) * Math.cos((player.r - self.extraR) * self.deg);
					moveY = player.speedM * ((player.speed / 2) + 1) * Math.sin((player.r - self.extraR) * self.deg);
				}
				else if(player.forceM < 0) {
					moveX = -player.speedM * ((player.speed / 2) + 1) * Math.cos((player.r - self.extraR) * self.deg);
					moveY = -player.speedM * ((player.speed / 2) + 1) * Math.sin((player.r - self.extraR) * self.deg);
				}
			}

			var collided = false;

			for(var i in self.players) {
				if(self.players[i] != player) {
					var check = self.players[i];

					var dx = (player.x + moveX) - check.x;
					var dy = (player.y + moveY) - check.y;

					if(Math.sqrt(dx * dx + dy * dy) <= player.radius + check.radius) {
						moveX = 0;
						moveY = 0;
						check.knockback = true;
						check.speedM = player.speedM;
						check.knockbackStep = 20;
						check.knockbackR = player.r;
						player.forceM = 0;
					}
				}
			}

			var newX = player.x + moveX;
			var newY = player.y + moveY;

			if(newX < player.radius || newX > (self.mapSize - player.radius) ||
			   newY < player.radius || newY > (self.mapSize - player.radius)) {
				moveX = 0;
				moveY = 0;
				player.speedM = 40;

				player.knockback = true;
				player.knockbackStep = 20;

				if(newX < player.radius) {
					player.knockbackR = 90;
				}
				else if(newX > (self.mapSize - player.radius)) {
					player.knockbackR = 270;
				}
				else if(newY < player.radius) {
					player.knockbackR = 180;
				}
				else if(newY > (self.mapSize - player.radius)) {
					player.knockbackR = 90;
				}
			}

			if(self.collidingRect(player, [self.szX, self.szY, self.szW, self.szH])) {
				if(player.team == self.defenders) {
					player.safezone(self.players);
					player.canShoot = false;
				}
				else {
					if(player.name == self.flagPlayer && !self.restarting) {
						self.restarting = true;
						console.log("Restating the game");

						setTimeout(function() {
							self.flagPlayer = null;

							for(var n in self.players) {
								self.players[n].socket.emit("finished");
							}

							setTimeout(function() {
								self.restarting = false;
							}, 500);
						}, 1000);
					}
				}

				if(player.team == 0) {
					player.safe = true;
				}
			}
			else {
				player.canShoot = true;
				player.safe = false;
			}

			player.x += moveX;
			player.y += moveY;

			if(self.collidingRect(player, [self.flagX, self.flagY, self.flagW, self.flagH]) && player.team == self.attackers && self.flagPlayer == null && self.teams[1] > 0) {
				player.flagTime++;

				if(self.capturingPlayer == null) {
					self.capturingPlayer = player.name;

					for(var n in self.players) {
						self.players[n].socket.emit("capturing", true, player.name, self.captureTime);
					}
				}

				if(player.name == self.capturingPlayer) {
					self.onFlag = true;
				}

				self.capturing = true;
			}
			else {
				player.flagTime = 0;
			}

			for(var n in self.fueltanks) {
				var tank = self.fueltanks[n];

				for(var i in self.players) {
					var check = self.players[i];

					var dx = tank.x - check.x;
					var dy = tank.y - check.y;

					if(Math.sqrt(dx * dx + dy * dy) <= tank.radius + check.radius && check.boost < 100) {
						check.boost += (100 / 15) * tank.fuel;

						console.log("Player " + check.name + " collected a fuel tank (" + tank.fuel + ")");

						if(check.boost > 100) {
							check.boost = 100;
						}

						if(Math.floor(check.boost / (100 / 15)) != check.clientBoost) {
							check.clientBoost = Math.floor(check.boost / (100 / 15));
							check.socket.emit("stat", "boost", check.clientBoost);
						}

						for(var n in self.players) {
							self.players[n].socket.emit("fuel_remove", tank.x, tank.y);
						}

						for(var n in self.fueltanks) {
							if(self.fueltanks[n] == tank) {
								self.fueltanks.splice(n, 1);
							}
						}
					}
				}
			}
		}

		for(var n in self.players) {
			var player = self.players[n];

			player.heal();

			if(player.shooting && player.heat < 20 && !player.cooling_down && !player.isBoosting && player.canShoot) {
				var x1 = player.x;
				var y1 = player.y;

				if(player.curTurret == 0) {
					x1 -= 170 * Math.cos((player.r - self.extraR) * self.deg);
					y1 -= 134 * Math.sin((player.r - self.extraR) * self.deg);
				}
				else if(player.curTurret == 1) {
					x1 += 169 * Math.cos((player.r - self.extraR) * self.deg);
					y1 -= 134 * Math.sin((player.r - self.extraR) * self.deg);
				}
				else if(player.curTurret == 2) {
					x1 -= 136 * Math.cos((player.r - self.extraR) * self.deg);
					y1 -= 171 * Math.sin((player.r - self.extraR) * self.deg);
				}
				else if(player.curTurret == 3) {
					x1 += 134 * Math.cos((player.r - self.extraR) * self.deg);
					y1 -= 171 * Math.sin((player.r - self.extraR) * self.deg);
				}

				var x2 = (self.bulletDistance * Math.cos((player.r - self.extraR) * self.deg)) + x1;
				var y2 = (self.bulletDistance * Math.sin((player.r - self.extraR) * self.deg)) + y1;

				for(var n in self.players) {
					var check = self.players[n];

					if(check == player || check.team == player.team) {
						continue;
					}

					if (check.x < (player.x - 3000) || check.x > (player.x + 3000) ||
						check.y < (player.y - 3000) || check.y > (player.y + 3000)) {
						continue;
					}

					if(collide([x1, y1], [x2, y2], [check.x, check.y], check.radius)) {
						var died = check.hit(player, self.players);

						if(died) {
							player.boost += check.boost;

							if(player.boost > 100) {
								player.boost = 100;
							}

							if(Math.floor(player.boost / (100 / 15)) != player.clientBoost) {
								player.clientBoost = Math.floor(player.boost / (100 / 15));
								player.socket.emit("stat", "boost", player.clientBoost);
							}

							if(player.name == self.flagPlayer) {
								console.log("Player " + self.flagPlayer + " lost the flag");

								for(var n in self.players) {
									self.players[n].socket.emit("captured", self.flagPlayer, false);
								}

								self.flagPlayer == null;
							}
						}
					}
				}

				player.shoot(self.players);
			}
			else {
				player.cool();
			}
		}

		// Update the players for every player
		for(var n in self.players) {
			self.players[n].updatePlayers(self.players);
			self.players[n].updateMyself();
		}

		if(self.capturing) {
			if(!self.onFlag) {
				var sorted = self.players.sort(function(a, b) {
					return a.flagTime - b.flagTime;
				});

				if(sorted.length == 0 || sorted[0].flagTime == 0) {
					for(var n in self.players) {
						self.players[n].socket.emit("capturing", false);
					}
					self.capturingPlayer = null;
					self.captureTime = self.maxCaptureTime;
					return;
				}

				self.capturingPlayer = sorted[0].name;

				for(var n in self.players) {
					self.players[n].socket.emit("capturing", true, self.capturingPlayer.name, self.captureTime);
				}
			}

			self.onFlag = false;

			if(self.captureTime > 0 && self.flagPlayer == null) {
				self.captureTime--;
			}
			else if(self.flagPlayer == null) {
				self.flagPlayer = self.capturingPlayer;

				self.capturingPlayer = null;
				self.captureTime = self.maxCaptureTime;
				self.capturing = false;
				self.onFlag = false;

				console.log("Player " + self.flagPlayer + " captured the flag");

				for(var n in self.players) {
					self.players[n].socket.emit("captured", self.flagPlayer, true);
				}
			}
		}
	}

	gameloop.gameloop(self.update);

	String.prototype.replaceAll = function(search, replacement) {
    	var target = this;
   		return target.replace(new RegExp(search, 'g'), replacement);
	};

	io.on('connection', function(socket) {
		/***** Handle packets *****/

		// A player is joining the server
		socket.on('join', function(name) {
			// If the name was null, generate a random name
			if(name == null || name == "") {
				name = namegenerator.generate();
			}

			name = name.replaceAll("<", "&lt;");
			name = name.replaceAll(">", "&gt;");

			if(name.includes(" ")) {
				socket.emit("kicked", "Name is invalid!");
				return;
			}

			var used = false;
			var s = false;
			for(var n in self.players) {
				// Check if name is already used
				if(self.players[n].name.toUpperCase() == name.toUpperCase()) {
					socket.emit("kicked", "Name is already used!");
					return;
				}

				// Check if user already has a player object
				if(self.players[n].socket.id == socket.id) {
					socket.emit("kicked", "That socket is already used!");
					return
				}
			}

			// Create a new user
			var p = new player.player(io, socket, name);

			p.team = self.teamPicker();

			// Send that player has joined
			socket.emit("joined", p.name);

			p.generateLocation(self.players, self.mapSize, self.szX, self.szY, self.szW, self.szH);

			for(var n in self.players) {
				self.players[n].socket.emit("spawn", name, p.x, p.y, p.r, p.team);
				socket.emit("spawn", self.players[n].name, self.players[n].x, self.players[n].y, self.players[n].r, self.players[n].team);
			}

			for(var n in self.fueltanks) {
				socket.emit("fuel_spawn", self.fueltanks[n].x, self.fueltanks[n].y, self.fueltanks[n].r, self.fueltanks[n].fuel);
			}

			if(self.capturing) {
				p.socket.emit("capturing", true, self.capturingPlayer, self.captureTime);
			}
			else if(self.flagPlayer != null) {
				p.socket.emit("captured", self.flagPlayer, true);
			}

			self.players.push(p);

			p.start();

			socket.emit("spawn", p.name, p.x, p.y, p.r, p.team);

			console.log("Player " + name + " (" + p.team + ") connected");

			if(self.teams[0] > 0 && self.teams[1] == 0) {
				for(var n in self.players) {
					self.players[n].socket.emit("wait", true);
				}
			}
			else if((self.teams[0] > 0 && self.teams[1] == 1) || self.teams[0] == 0) {
				for(var n in self.players) {
					self.players[n].socket.emit("wait", false);
				}
			}
		});

		socket.on('latency', function() {
    		socket.emit('latency');
  		});

		// A player has typed some thing or done some type of input
		socket.on('input', function(button, type) {
			var player = self.getPlayer(socket);

			player.waitTime = 0;

			if(button == 87 || button == 83 || button == 65 || button == 68 || button == 32) {
				player.hold(button, type);
			}

			if(button == -1) {
				player.shooting = type;
			}
		});

		socket.on('upgrade', function(upgrade) {
			var player = self.getPlayer(socket);
			player.waitTime = 0;
			player.upgrade(upgrade);
		});

		// A player has disconnected
		socket.on('disconnect', function() {
			// Remove user from the players list and all other lists
			for(var n in self.players) {
				if(self.players[n].socket.id == socket.id) {
					// Remove name from list
					namegenerator.removeNumber(self.players[n].name);

					console.log("Player " + self.players[n].name + " disconnected");

					var player = self.players[n];

					// Remove from players
					self.players.splice(n, 1);

					for(var n in self.players) {
						self.players[n].socket.emit("leave", player.name);
					}

					if(player.name == self.flagPlayer) {
						console.log("Player " + self.flagPlayer + " lost the flag");

						for(var n in self.players) {
							self.players[n].socket.emit("captured", self.flagPlayer, false);
						}

						self.flagPlayer = null;
					}

					self.teams[player.team]--;

					if(self.teams[0] > 0 && self.teams[1] == 0) {
						for(var n in self.players) {
							self.players[n].socket.emit("wait", true);
						}

						if(self.flagPlayer != null) {
							for(var n in self.players) {
								self.players[n].socket.emit("captured", self.flagPlayer, false);
							}
						}

						self.flagPlayer = null;
					}
					else if((self.teams[0] > 0 && self.teams[1] == 1) || self.teams[0] == 0) {
						for(var n in self.players) {
							self.players[n].socket.emit("wait", false);
						}
					}
				}
			}
		});
	});
}