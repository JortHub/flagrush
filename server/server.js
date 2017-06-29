module.exports = function(io) {
	var namegenerator = require('./namegenerator')();
	var player = require('./player');
	var gameloop = require('./gameloop');

	var self = {}
	self.players = [];

	self.maxR = 6;
	self.maxM = 6;
	self.minR = 0;
	self.minM = 0;
	self.accM = 0.3;
	self.decM = 0.15;
	self.accR = 0.3;
	self.decR = 0.6;
	self.mapSize = 1000;

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

	self.update = function() {
		if(self.players.length <= 0) {
			return;
		}
	
		// Update the forces and so the player's locations
		for(var n in self.players) {
			var player = self.players[n];

			var moved = false;
			var rotated = false;

			if(player.isHold(87) && !player.knockback) {
				player.addForce(10, 0);
				player.speedM += self.accM;

				if(player.speedM >= (self.maxM - 0.2)) {
					player.speedM = self.maxM;
				}

				moved = true;
			}
			
			if(player.isHold(83) && !player.knockback) {
				player.addForce(-10, 0);
				player.speedM += self.accM;

				if(player.speedM >= (self.maxM - 0.2)) {
					player.speedM = self.maxM;
				}

				moved = true;
			}

			if(!moved) {
				if(player.speedM <= (self.minM + 0.2)) {
					player.speedM = self.minM;
					player.forceM = self.minM;
				}
				else {
					player.speedM -= self.decM;
				}
			}

			if(player.isHold(65)) {
				player.addForce(0, -10);
				player.speedR += self.accR;

				if(player.speedR >= (self.maxR - 0.4)) {
					player.speedR = self.maxR;
				}

				rotated = true;
			}
			
			if(player.isHold(68)) {
				player.addForce(0, 10);
				player.speedR += self.accR;

				if(player.speedR >= (self.maxR - 0.4)) {
					player.speedR = self.maxR;
				}

				rotated = true;
			}

			if(!rotated) {
				if(player.speedR <= (self.minR + 0.4)) {
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

			if(player.r > 360) {
				player.r -= 360;
			} 
			else if(player.r < -360) {
				player.r += 360;
			}

			var moveX = 0;
			var moveY = 0;

			if(player.knockback) {
				moveX = player.speedM * Math.cos(player.knockbackR);
				moveY = player.speedM * Math.sin(player.knockbackR);

				player.knockbackStep--;

				if(player.knockbackStep == 0) {
					player.knockback = false;
				}
			}
			else {
				if(player.forceM > 0) {
					moveX = player.speedM * Math.cos(player.r * Math.PI / 180);
					moveY = player.speedM * Math.sin(player.r * Math.PI / 180);
				}
				else if(player.forceM < 0) {
					moveX = -player.speedM * Math.cos(player.r * Math.PI / 180);
					moveY = -player.speedM * Math.sin(player.r * Math.PI / 180);
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
						check.knockbackR = Math.atan2(check.y - player.y, check.x - player.x);
						player.forceM = 0;
					}
				}
			}

			var newX = player.x + moveX;
			var newY = player.y + moveY;

			if(newX < player.radius || newX > (player.radius + self.mapSize) ||
			   newY < player.radius || newY > (player.radius + self.mapSize)) {
				moveX = 0;
				moveY = 0;
				player.speedM = 3;

				player.knockback = true;
				player.knockbackStep = 20;

				if(newX < player.radius) {
					player.knockbackR = 0;
				}
				else if(newX > (player.radius + self.mapSize)) {
					player.knockbackR = 180;
				}
				else if(newY < player.radius) {
					player.knockbackR = 90;
				}
				else if(newY > (player.radius + self.mapSize)) {
					player.knockbackR = 270;
				}
			}

			player.x += moveX;
			player.y += moveY;
		}

		// Update the players for every player
		for(var n in self.players) {
			self.players[n].updatePlayers(self.players);
			self.players[n].updateMyself();
		}
	}

	gameloop.gameloop(self.update);

	io.on('connection', function(socket) {
		/***** Handle packets *****/

		// A player is joining the server
		socket.on('join', function(name) {
			// If the name was null, generate a random name
			if(name == null) {
				name = namegenerator.generate();
			}

			var used = false;
			var s = false;
			for(var n in self.players) {
				// Check if name is already used
				if(self.players[n].name == name) {
					used = true;
				}

				// Check if user already has a player object
				if(self.players[n].socket.id == socket.id) {
					//s = true; OFF FOR NOW
				}
			}

			if(!used && !s) {
				// Send that player has joined
				socket.emit("joined", name);

				for(var n in self.players) {
					self.players[n].socket.emit("spawn", name);
					socket.emit("spawn", self.players[n].name, self.players[n].x, self.players[n].y, self.players[n].r);
				}

				// Create a new user
				var p = new player.player(io, socket, name);
				 
				self.players.push(p);

				socket.emit("spawn", p.name, p.x, p.y, p.r);

				console.log("Player connected: " + name);
			}
			else if(!s) {
				// The player has been kicked since the name was already used
				socket.emit("kicked", "Name is already used!");
			}
		});

		// A player has typed some thing or done some type of input
		socket.on('input', function(button, type) {
			var player = self.getPlayer(socket);

			if(button == 87 || button == 83 || button == 65 || button == 68) {
				player.hold(button, type);
			}
		});

		// A player has disconnected
		socket.on('disconnect', function() {
			// Remove user from the players list and all other lists
			for(var n in self.players) {
				if(self.players[n].socket.id == socket.id) {
					// Remove name from list
					namegenerator.removeNumber(self.players[n].name);

					console.log("Player disconnected: " + self.players[n].name);

					var name = self.players[n].name;

					// Remove from players
					self.players.splice(n, n + 1);

					for(var n in self.players) {
						self.players[n].socket.emit("leave", name);
					}
				}
			}
		});
	});
}