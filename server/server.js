module.exports = function(io) {
	var namegenerator = require('./namegenerator')();
	var player = require('./player');
	var gameloop = require('./gameloop');

	var self = {}
	self.players = [];
	self.resistanceR = 3;
	self.resistanceP = 3;

	self.getPlayer = function(socket) {
		for(var n in self.players) {
			if(socket.id == self.players[n].socket.id) {
				return self.players[n];
			}
		}
	}

	self.update = function() {
		if(self.players.length <= 0) {
			return;
		}
	
		// Update the forces and so the player's locations
		for(var n in self.players) {
			var player = self.players[n];

			if(player.isHold("w")) {
				player.addForce(0, 5, 0);
			}
			if(player.isHold("s")) {
				player.addForce(0, -5, 0);
			}
			if(player.isHold("a")) {
				player.addForce(0, 0, -5);
			}
			if(player.isHold("d")) {
				player.addForce(0, 5, 5);
			}
		}

		for(var n in self.players) {
			var player = self.players[n];

			if(player.forceX > 0) {
				player.x += (player.forceX <= self.resistanceP) ? player.forceX : player.forceX - self.resistanceP;
				player.forceX = (player.forceX <= self.resistanceP) ? 0 : player.forceX - self.resistanceP;
			}
			else {
				player.x -= (player.forceX >= -self.resistanceP) ? player.forceX : player.forceX - self.resistanceP;
				player.forceX = (player.forceX >= -self.resistanceP) ? 0 : player.forceX + self.resistanceP;
			}

			if(player.forceY > 0) {
				player.y += (player.forceX <= self.resistanceP) ? player.forceX : player.forceX - self.resistanceP;
				player.forceX = (player.forceX <= self.resistanceP) ? 0 : player.forceX - self.resistanceP;
			}
			else {
				player.y -= (player.forceX >= -self.resistanceP) ? player.forceX : player.forceX - self.resistanceP;
				player.forceX = (player.forceX >= -self.resistanceP) ? 0 : player.forceX + self.resistanceP;
			}

			if(player.forceR > 0) {
				player.r += (player.forceY <= self.resistanceR) ? player.forceY : player.forceY - self.resistanceP;
				player.forceY = (player.forceY <= self.resistanceR) ? 0 : player.forceY - self.resistanceP;
			}
			else {
				player.r -= (player.forceR >= -self.resistanceR) ? player.forceR : player.forceR - self.resistanceR;
				player.forceR = (player.forceR >= -self.resistanceR) ? 0 : player.forceR + self.resistanceR;
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

			if(button == "w" || button == "s" || button == "a" || button == "d") {
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