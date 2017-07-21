module.exports = {
	player: function(io, socket, name) {
		var self = {};

		// The position and rotation
		self.x = 0;
		self.y = 0;
		self.r = 0;

		// The old position and rotation
		self.oldX = 0;
		self.oldY = 0;
		self.oldR = 0;

		// If the waiting packet has been send yet
		self.waitingSend = false;

		// The target rotation
		self.targetR = -1;

		// The slowdown amount for the player
		self.slowdown = null;

		// Some socket information
		self.socket = socket;
		self.io = io;

		// The name of the player
		self.name = name;

		// The team the player is in
		self.team = 0;

		// The current hold buttons
		self.buttons = [];

		// The forces the player has
		self.forceM = 0;
		self.forceR = 0;

		// The speeds of the player
		self.speedM = 0;
		self.speedR = 0;

		// The radius of the player's collision
		self.radius = 200;

		// The max viewdistance of the player
		self.max = 100;

		// The knockback the player has
		self.knockback = false;
		self.knockbackR = 0;
		self.knockbackStep = 0;

		// The stats of the player
		self.boost = 50; // Max of 100
		self.clientBoost = 7;
		self.health = 50; // Max of 50
		self.clientHealth = 15; 
		self.heat = 0; // Max of 50
		self.clientHeat = 0;

		// The upgrades of the player
		self.speed = 0;
		self.regen = 0;
		self.damage = 0;

		// The amount of kills a player has
		self.kills = 0;

		// If the player is shooting
		self.shooting = false;

		// The current turret of the player
		self.curTurret = 0;

		// The cooldown for shooting
		self.cooldown = 0;

		// If the player is cooling down
		self.cooling_down = false;

		// If the player is currently using boost
		self.isBoosting = false;

		// If the player is safe, which attackers are in the safezone
		self.safe = false;

		// If the player can shoot
		self.canShoot = true;

		// The message to=ime for the player
		self.messageTime = 0;

		// The player's time on the flag
		self.flagTime = 0;

		// The points the player has left
		self.pointsLeft = 0;

		// The AFK time of the player
		self.waitTime = 0;

		// Generates the location for the player
		self.generateLocation = function(players, mapSize, szX, szY, szW, szH) {
			// If the player is a attacker, spawn him in the safezone
			if(self.team == 0) {
				self.x = szX + Math.random() * szW;
				self.y = szY + Math.random() * szH;
			}

			// If the player is a defender, spawn in the above half of the map
			else {
				self.x = Math.random() * mapSize;
				self.y = Math.random() * mapSize / 2;
			}

			// Calculate a random rotation
			self.r = Math.random() * 360;

			// Check if the location is not on other players
			for(var i in players) {
				if(players[i] != self) {
					var check = players[i];

					var dx = self.x - check.x;
					var dy = self.y - check.y;

					if(Math.sqrt(dx * dx + dy * dy) <= self.radius + check.radius) {
						self.generateLocation(players, mapSize, szX, szY, szW, szH);
						return;
					}
				}
			}

			// Check if the location is inside the map
			if(self.x < self.radius || self.x > (mapSize - self.radius) ||
			   self.y < self.radius || self.y > (mapSize - self.radius)) {
				self.generateLocation(players, mapSize, szX, szY, szW, szH);
				return;
			}
		}

		// Start the player, so send him all of his stat packets
		self.start = function() {
			self.socket.emit("stat", "health", self.clientHealth);
			self.socket.emit("stat", "heat", self.clientHeat);
			self.socket.emit("stat", "boost", self.clientBoost);
		}

		// Upgrade on the player's upgrades
		self.upgrade = function(upgrade) {
			// Check if the player is even able to upgrade
			if(self.pointsLeft > 0) { 
				// Add speed to the player
				if(upgrade == "speed" && self.speed < 15) {
					self.speed++;
					self.pointsLeft--;
					console.log("Player " + self.name + " upgraded " + upgrade + " to lvl " + self.speed);
				}
				// Add regen to the player
				else if(upgrade == "regen" && self.regen < 15) {
					self.regen++;
					self.pointsLeft--;
					console.log("Player " + self.name + " upgraded " + upgrade + " to lvl " + self.regen);
				}
				// Add damage to the player
				else if(upgrade == "damage" && self.damage < 15) {
					self.damage++;
					self.pointsLeft--;
					console.log("Player " + self.name + " upgraded " + upgrade + " to lvl " + self.damage);
				}
			}
		}

		// Heals the player
		self.heal = function(players) {
			// The amount it will regenerate
			self.health += (0.1 * (self.regen / 15)) + 0.03;

			// If the health is over the maximum, set it back to the maximum
			if(self.health > 50) {
				self.health = 50;
			}

			// Update the health for everyone
			if(Math.round(self.health / (50 / 15)) != self.clientHealth) {
				self.clientHealth = Math.round(self.health / (50 / 15));
				self.socket.emit("stat", "health", self.clientHealth);
				for(var n in players) {
					players[n].socket.emit("health", self.name, self.clientHealth);
				}
			}
		}

		// Boosts the player
		self.boosting = function(players, boostM) {
			// Adds the forces and speed
			self.forceM = 100;
			self.speedM = boostM;

			// Decrease the boost left
			self.boost--;
			self.isBoosting = true;

			// Update the stat of player
			if(Math.round(self.boost / (100 / 15)) != self.clientBoost) {
				self.clientBoost = Math.round(self.boost / (100 / 15));
				self.socket.emit("stat", "boost", self.clientBoost);
			}

			// Send to all the players in range if the player is boosting
			for(var n in players) {
				var player = players[n];

				if (player.x < (self.x - 8000) || player.x > (self.x + 8000) ||
					player.y < (self.y - 8000) || player.y > (self.y + 8000)) {
					continue;
				}

				player.socket.emit("boost", self.name);
			}
		}

		// Hits a player
		self.hit = function(player, players, flagPlayer) {
			// A player can't get hit when they're in the safezone
			if(self.safe) {
				return;
			}

			// Remove the health from the player
			self.health -= 1.7 + (player.damage / 15);

			// Send a hit package to all of the players
			for(var n in players) {
				players[n].socket.emit("hit", self.name);
			}

			// Update the health for everyone
			if(Math.round(self.health / (50 / 15)) != self.clientHealth) {
				self.clientHealth = Math.round(self.health / (50 / 15));
				self.socket.emit("stat", "health", self.clientHealth);
				for(var n in players) {
					players[n].socket.emit("health", self.name, self.clientHealth);
				}
			}

			// If the player has no health left
			if(self.health <= 0) {
				// Add a kill and a point to the player
				player.kills++;
				player.pointsLeft++;

				// Send everyone the killed packet
				for(var n in players) {
					players[n].socket.emit("killed", self.name, player.name);
				}

				// Log that the player has been killed
				console.log("Player " + self.name + " was killed by " + player.name);

				// Disconnect the socket
				self.socket.disconnect();

				// Return true
				return true;
			}
			
			return false;
		}

		self.safezone = function(players) {
			self.health -= 0.5;

			self.socket.emit("message", "Get out of the safe zone");

			for(var n in players) {
				players[n].socket.emit("hit", self.name);
			}

			if(Math.round(self.health / (50 / 15)) != self.clientHealth) {
				self.clientHealth = Math.round(self.health / (50 / 15));
				self.socket.emit("stat", "health", self.clientHealth);
				for(var n in players) {
					players[n].socket.emit("health", self.name, self.clientHealth);
				}
			}

			if(self.health <= 0) {
				for(var n in players) {
					players[n].socket.emit("killed", self.name, "the safezone");
				}

				self.socket.disconnect();
			}
		}

		self.cool = function() {
			if(self.cooling_down) {
				self.cooldown--;
			}

			if(self.cooldown > 0) {
				return;
			}
			else {
				self.cooling_down = false;
			}

			if(self.shooting && self.heat == 20) {
				return;
			}

			self.heat -= 0.15;

			if(self.heat < 0) {
				self.heat = 0;
			}

			if(Math.round(self.heat / (20 / 15)) != self.clientHeat) {
				self.clientHeat = Math.round(self.heat / (20 / 15));
				socket.emit("stat", "heat", self.clientHeat);
			}
		}

		self.shoot = function(players) {
			self.curTurret++;

			if(self.curTurret > 3) {
				self.curTurret = 0;
			}

			for(var n in players) {
				var player = players[n];

				if (player.x < (self.x - 8000) || player.x > (self.x + 8000) ||
					player.y < (self.y - 8000) || player.y > (self.y + 8000)) {
					continue;
				}

				player.socket.emit("shoot", self.name, self.curTurret);
			}

			self.heat += 1;

			if(self.heat > 20) {
				self.heat = 20;
			}

			if(Math.round(self.heat / (20 / 15)) != self.clientHeat) {
				self.clientHeat = Math.round(self.heat / (20 / 15));
				socket.emit("stat", "heat", self.clientHeat);
			}

			self.cooling_down = true;
			self.cooldown = 3;
		}

		self.updatePlayers = function(players) {
			for(var n in players) {
				var player = players[n];

				if(player == self) {
					continue;
				}

				if(Math.round(player.x) == Math.round(player.oldX) && 
					Math.round(player.y) == Math.round(player.oldY) &&
					Math.round(player.r) == Math.round(player.oldR)) {
					if(!player.waitingSend) {
						socket.emit("move", player.name, 0, 0, 0, false);
					}
					continue;
				}

				if((player.x - self.x <= self.max || player.x - self.x >= -self.max) && 
				   (player.y - self.y <= self.max || player.y - self.y >= -self.max)) {
					socket.emit("move", player.name, Math.round(player.x), Math.round(player.y), Math.round(player.r), true);
				}
			}
		}

		self.updateMyself = function() {
			if(Math.round(self.x) == Math.round(self.oldX) && 
				Math.round(self.y) == Math.round(self.oldY) &&
				Math.round(self.r) == Math.round(self.oldR)) {
				if(!self.waitingSend) {
					socket.emit("move", self.name, 0, 0, 0, false);
					self.waitingSend = true;
				}
				return;
			}

			self.waitingSend = false;

			socket.emit("move", self.name, Math.round(self.x), Math.round(self.y), Math.round(self.r), true);

			self.oldX = self.x;
			self.oldY = self.y;
			self.oldR = self.r;
		}

		self.hold = function(button, state) {
			self.buttons[button] = state;
		}

		self.isHold = function(button) {
			var b = self.buttons[button];

			if(b == null) {
				return false;
			}

			return b;
		}

		self.addForce = function(forceM, forceR) {
			self.forceM += forceM;
			self.forceR += forceR;

			if(self.forceM > 50) self.forceM = 50;
			if(self.forceM < -50) self.forceM = -50;

			if(self.forceR > 30) self.forceR = 30;
			if(self.forceR < -30) self.forceR = -30;
		}

		self.removeForce = function(forceX, forceY, forceR) {
			self.forceX -= forceX;
			self.forceY -= forceY;
			self.forceR -= forceR;

			if(self.forceX > 10) self.forceX = 10;
			if(self.forceX < -10) self.forceX = -10;

			if(self.forceY > 10) self.forceY = 10;
			if(self.forceY < -10) self.forceY = -10;

			if(self.forceR > 10) self.forceR = 10;
			if(self.forceR < -10) self.forceR = -10;
		}

		self.generateLocation();

		return self;
	}
}