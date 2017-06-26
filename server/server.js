module.exports = function(io) {
	var namegenerator = require('./namegenerator')();
	var player = require('./player');
	var gameloop = require('./gameloop');

	var self = {}
	self.players = [];

	self.maxR = 2.5;
	self.maxM = 2;
	self.minR = 0;
	self.minM = 0;
	self.accM = 0.04;
	self.decM = 0.02;
	self.accR = 0.1;
	self.decR = 0.2;

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

			if(player.isHold(87)) {
				player.addForce(10, 0);
				player.speedM += self.accM;

				if(player.speedM >= (self.maxM - 0.2)) {
					player.speedM = self.maxM;
				}

				moved = true;
			}
			
			if(player.isHold(83)) {
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

				//if(player.speedM > 0) console.log(player.name + ": " + player.speedM);
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
				player.speedR -= self.decR;

				if(player.speedR <= (self.minR + 0.4)) {
					player.speedR = self.minR;
					player.forceR = self.minR;
				}
			}

		}

		for(var n in self.players) {
			var player = self.players[n];

			/*if(player.forceR > 0) {
				player.r += (player.forceR <= player.speedR) ? player.forceR : player.speedR;
				player.forceR = (player.forceR <= player.speedR) ? 0 : player.forceR - player.speedR;
			}
			else {
				player.r += (player.forceR >= -player.speedR) ? player.forceR : -player.speedR;
				player.forceR = (player.forceR >= -player.speedR) ? 0 : player.forceR + player.speedR;
			}

			if(player.r > 360) {
				player.r -= 360;
			} 
			else if(player.r < -360) {
				player.r += 360;
			}

			if(player.forceM > 0) {
				var speed = (player.forceM >= player.speedM) ? player.speedM : player.forceM;

				player.x += speed * Math.cos(player.r * Math.PI / 180);
				player.y += speed * Math.sin(player.r * Math.PI / 180);

				player.forceM -= speed;
			}
			else {
				var speed = (player.forceM <= -player.speedM) ? -player.speedM : player.forceM;

				player.x += speed * Math.cos(player.r * Math.PI / 180);
				player.y += speed * Math.sin(player.r * Math.PI / 180);

				player.forceM -= speed;
			}*/

			if(player.forceR > 0) {
				player.r += player.speedR;
				player.forceR -= player.speedR;
			}
			else {
				player.r -= player.speedR;
				player.forceR += player.speedR;
			}

			if(player.r > 360) {
				player.r -= 360;
			} 
			else if(player.r < -360) {
				player.r += 360;
			}

			if(player.forceM > 0) {
				player.x += player.speedM * Math.cos(player.r * Math.PI / 180);
				player.y += player.speedM * Math.sin(player.r * Math.PI / 180);

				//console.log(player.name 
				//	+ " - x: " + player.x 
				//	+ ", y: " + player.y
				//	+ ", s: " + player.speedM
				//	+ ", cs: " + self.round(player.speedM, 2) 
				//	+ ", r: " + player.r
				//	+ ", cr: " + Math.cos(player.r * Math.PI / 180));
			}
			else if(player.forceM < 0) {
				player.x -= player.speedM * Math.cos(player.r * Math.PI / 180);
				player.y -= player.speedM * Math.sin(player.r * Math.PI / 180);
			}
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