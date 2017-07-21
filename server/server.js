module.exports = function(io) {
	// All the public variables
	var namegenerator = require('./namegenerator')();
	var player = require('./player');
	var gameloop = require('./gameloop');
	var collide = require('line-circle-collision');

	// The self variable
	var self = {}

	// The list of all the players
	self.players = [];

	// The maximum speeds
	self.maxR = 12;
	self.maxM = 90;

	// The minimal speeds
	self.minR = 0;
	self.minM = 0;

	// The acceleration speeds
	self.accM = 3;
	self.accR = 0.6;

	// The deceleration speeds
	self.decM = 2;
	self.decR = 1.2;

	// The speed buffers
	self.bufM = 0.2;
	self.bufR = 0.4;

	// The speed of the boost
	self.boostM = 140;

	// The size of the map
	self.mapSize = 25000;
	
	// The teams
	self.teams = [0, 0];

	// The code for attackers
	self.attackers = 0;

	// The code for defenders
	self.defenders = 1;

	// If the flag is being captured
	self.capturing = false;

	// The maximum capture time
	self.maxCaptureTime = 100;

	// The current capture time
	self.captureTime = self.maxCaptureTime;

	// If the capturing player is on the flag
	self.onFlag = false;

	// The player that is on the flag
	self.capturingPlayer = null;

	// The player that has the flag
	self.flagPlayer = null;

	// The location and size of the flag
	self.flagX = 12000;
	self.flagY = 2500;
	self.flagW = 1000;
	self.flagH = 1000;

	// The location and size of the safezone
	self.szX = 7500;
	self.szY = 23000;
	self.szW = 10000;
	self.szH = 2000;

	// If the server is restarting
	self.restarting = false;

	// The distance that a bullet travels
	self.bulletDistance = 2000;

	// The AFK time
	self.maxWaitTime = 9000;

	// The calculation of a degree
	self.deg = Math.PI / 180;

	// The amount of degrees in a circle
	self.circle = 360;

	// The extra degrees to make the player look rightly rotated
	self.extraR = 90;

	// An array of all the fuel tanks
	self.fueltanks = [];

	// The minimal amount of fuel tanks
	self.minTanks = 3;

	// The maximum distance for calculations
	self.maxCalcDistance = 1000;

	// A function to replace all found matches
	String.prototype.replaceAll = function(search, replacement) {
    	var target = this;
   		return target.replace(new RegExp(search, 'g'), replacement);
	};

	// Generate a fuel tank
	self.fuelTank = function() {
		// The self variable
		var s = {};

		// The x position of the fuel tank
		s.x = 0;

		// The y position of the fuel tank
		s.y = 0;

		// The rotation of the fuel tank
		s.r = 0;

		// The radius of the fuel tank
		s.radius = 100;

		// The amount of fuel in the tank
		s.fuel = Math.round(Math.random() * 7) + 3;

		// Randomize the location of the player and spawn it
		s.spawn = function() {
			// Randomize the location and rotation of the fuel tank
			s.x = Math.random() * (self.mapSize - 6000) + 3000;
			s.y = Math.random() * (self.mapSize - 6000) + 3000;
			s.r = Math.random() * 360;

			// Chek with all players if the fueltanks if it isn't colliding, if so re-randomize everything
			for(var i in self.players) {
				var check = self.players[i];

				var dx = s.x - check.x;
				var dy = s.y - check.y;

				if(Math.sqrt(dx * dx + dy * dy) <= s.radius + check.radius) {
					s.spawn();
					return;
				}
			}

			// Send the location of the fuel tank to all the players
			for(var n in self.players) {
				self.players[n].socket.emit("fuel_spawn", Math.round(s.x), Math.round(s.y), Math.round(s.r), s.fuel);
			}
		}

		return s;
	}

	// Get a player by they're socket
	self.getPlayer = function(socket) {
		for(var n in self.players) {
			if(socket.id == self.players[n].socket.id) {
				return self.players[n];
			}
		}
	}

	// Check if a circle is colliding with a rectangle
	self.collidingRect = function(player, rect) {
		// Calculate both the distances
		var distX = Math.abs(player.x - rect[0] - rect[2] / 2);
		var distY = Math.abs(player.y - rect[1] - rect[3] / 2);

		// Do the calculations
		if(distX > (rect[2] / 2 + player.radius)) {
			return false;
		}
		if(distY > (rect[3] / 2 + player.radius)) {
			return false;
		}

		if(distX <= (rect[2] / 2)) {
			return true;
		}
		if(distY <= (rect[3] / 2)) {
			return true;
		}

		var dx = distX - rect[2] / 2;
		var dy = distY - rect[3] / 2;
		return (dx * dx + dy * dy <= (player.radius * player.radius));
	}

	// Pick the team for the player
	self.teamPicker = function() {
		// If there are more attackers than defenders make them a defender
		if(self.teams[self.attackers] > self.teams[self.defenders]) {
			self.teams[self.defenders]++;
			return self.defenders;
		}
		// If there's an equal amount of attackers and defenders choose randomly
		else if(self.teams[self.attackers] == self.teams[self.defenders]) {
			var n = Math.round(Math.random());
			self.teams[n]++;
			return n;
		}
		// If there are more defenders than attackers make them an attacker
		else {
			self.teams[self.attackers]++;
			return self.attackers;
		}
	}

	// The update function that runs every tick
	self.update = function() {
		// If there are no players, just skip this loop
		if(self.players.length <= 0) {
			return;
		}

		// If their are less tanks than the minimal amount create more
		for(var i = self.fueltanks.length; i < 3; i++) {
			var tank = new self.fuelTank();
			tank.spawn();
			self.fueltanks[i] = tank;
		}
	
		// Update the speeds of the player
		for(var n in self.players) {
			var player = self.players[n];
			var moved = false;
			var rotated = false;

			// Add 1 to the AFK time
			player.waitTime++;

			// If the player hsa been AFK for longer than allow, kick them
			if(player.waitTime > self.maxWaitTime) {
				player.socket.disconnect();
				continue;
			}
			
			// If the boosting button is hold, add boost to the player
			if(player.isHold(-3) && !player.knockback && player.boost > 0 && self.flagPlayer != player.name) {
				player.boosting(self.players, self.boostM);

				moved = true;
			}
			else {
				// If one of the acceleration buttons is pressed, add accelerated speed
				if(((player.isHold(32) && !player.isHold(16)) || 
					(player.isHold(87)) && !player.isHold(83)) && 
					!player.knockback) {
					if(player.forceM < 0) {
						if(player.speedM <= (self.minM + 30)) {
							player.forceM = self.minM;
						}
						else {
							player.speedM -= self.decM;
						}
					}
					else {
						player.addForce(10, 0);
						player.speedM += self.accM;

						if(player.speedM >= (self.maxM - self.bufM)) {
							player.speedM = self.maxM;
						}

						player.isBoosting = false;
					}

					moved = true;
				}

				// If one of the deceleration buttons is pressed, decelerate the player
				if(((player.isHold(16) && !player.isHold(32)) || 
					(player.isHold(83)) && !player.isHold(87)) && 
					!player.knockback) {
					if(player.forceM > 0) {
						if(player.speedM <= (self.minM + self.bufM)) {
							player.forceM = self.minM;
							player.speedM = self.minM;
						}
						else {
							player.speedM -= self.decM * 2;
						}

						moved = true;
					}
				}
			}

			// If nothing is pressed, decelerate the player
			if(!moved) {
				if(player.speedM <= (self.minM + self.bufM)) {
					player.speedM = self.minM;
					player.forceM = self.minM;
				}
				else {
					player.speedM -= self.decM;
				}

				player.isBoosting = false;
			}

			// If a target is set, go through
			if(player.targetR > -1) {
				// Calculate the distance
				var distance = 0;
				if(player.targetR - player.r < 180 && player.targetR - player.r > -180) {
					distance = player.targetR - player.r;
				}
				else if(player.r > player.targetR) {
					distance = 360 - player.r + player.targetR;
				}
				else {
					distance = -360 + player.targetR - player.r;
				}

				// Calculate the slowdown
				var slowdown = player.slowdown;
				var c = (player.speedR / self.decR) * (player.speedR / 2); 
				if(c > player.slowdown) {
					slowdown = c;
				}
				player.slowdown = slowdown;

				// If we have to rotate right > accelerate rightwards
				if(distance > 0 && slowdown < distance) {
					player.addForce(0, 10);
					player.speedR += self.accR;

					if(player.speedR >= self.maxR) {
						player.speedR = self.maxR;
					}
				}

				// If we have to rotate left > accelerate leftwards
				else if(distance < 0 && -slowdown > distance) {
					player.addForce(0, -10);
					player.speedR += self.accR;

					if(player.speedR >= self.maxR) {
						player.speedR = self.maxR;
					}
				}

				// If we have to slowdown, go through
				else if(distance != 0) {
					//Check if the following movement will get us closer to our target
					if((distance > 0 && distance < (player.speedR-self.decR)) ||
						(distance < 0 && distance > -(player.speedR-self.decR))) {
						player.speedR = 0;
						player.forceR = 0;
						player.slowdown = null;
						player.targetR = -1;
					}
					else if((distance > 0 && distance < self.decR) ||
						(distance < 0 && distance > -self.decR)) {
						player.speedR = 0;
						player.forceR = 0;
						player.slowdown = null;
						player.targetR = -1;
					}
					else if(player.speedR <= 0) {
						player.speedR = 0;
						player.forceR = 0;
						player.slowdown = null;
						player.targetR = -1;
					}

					// Else decelerate the player's rotation
					else {
						player.speedR -= self.decR;
					}
				}

				rotated = true;
			}
			else {
				// If the rotation buttons is pressed, use that
				if(player.isHold(68) && !player.knockback && !player.isHold(65)) {
					player.addForce(0, 10);
					player.speedR += self.accR;

					if(player.speedR >= self.maxR) {
						player.speedR = self.maxR;
					}

					rotated = true;
				}
				if(player.isHold(65) && !player.knockback && !player.isHold(68)) {
					player.addForce(0, -10);
					player.speedR += self.accR;

					if(player.speedR >= self.maxR) {
						player.speedR = self.maxR;
					}

					rotated = true;
				}
			}

			// If nothing is pressed, decelerate the user
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

		// Update the players locations
		for(var n in self.players) {
			var player = self.players[n];

			// Update the rotation of the player
			if(player.forceR > 0) {
				player.r += player.speedR;
			}
			else if(player.forceR < 0) {
				player.r -= player.speedR;
			}

			// Check if the rotation is in the circle range
			if(player.r > self.circle) {
				player.r -= self.circle;
			} 
			else if(player.r < 0) {
				player.r += self.circle;
			}

			// The move location of the player
			var moveX = 0;
			var moveY = 0;

			// If the player has knockback, do this
			if(player.knockback) {
				// Add the movement
				moveX = player.speedM * Math.cos((player.knockbackR - self.extraR) * self.deg);
				moveY = player.speedM * Math.sin((player.knockbackR - self.extraR) * self.deg);

				if(player.name == self.flagPlayer) {
					moveX /= 2;
					moveY /= 2;
				}

				// Update knockback steps
				player.knockbackStep--;

				// If the knockback is done, set it to false
				if(player.knockbackStep == 0) {
					player.knockback = false;
				}
			}

			// If he doesn't have knockback, do this
			else {
				// The players force is frontwards, do this
				if(player.forceM > 0) {
					moveX = player.speedM * ((player.speed / 25) + 1) * Math.cos((player.r - self.extraR) * self.deg);
					moveY = player.speedM * ((player.speed / 25) + 1) * Math.sin((player.r - self.extraR) * self.deg);
				}

				// If the force is backwards, do this
				else if(player.forceM < 0) {
					moveX = -player.speedM * ((player.speed / 25) + 1) * Math.cos((player.r - self.extraR) * self.deg);
					moveY = -player.speedM * ((player.speed / 25) + 1) * Math.sin((player.r - self.extraR) * self.deg);
				}
			}

			// If the player collided
			var collided = false;

			// Check with all the players collided. if so give both the players knockback
			for(var i in self.players) {
				if(self.players[i] != player) {
					var check = self.players[i];

					var dx = (player.x + moveX) - check.x;
					var dy = (player.y + moveY) - check.y;

					if(dx > self.maxCalcDistance || dx < -self.maxCalcDistance ||
						dy > self.maxCalcDistance || dy < -self.maxCalcDistance) {
						continue;
					}

					if(Math.sqrt(dx * dx + dy * dy) <= player.radius + check.radius) {
						moveX = 0;
						moveY = 0;

						check.forceM = 0;
						check.knockback = true;
						check.speedM = (player.speedM / 4) * 3;
						check.knockbackStep = 10;
						check.knockbackR = player.r;

						player.forceM = 0;
						player.knockback = true;
						player.knockbackR = player.r - 180;
						player.speedM = player.speedM / 4;
						player.knockbackStep = 10;
						if(player.knockbackR < 0) {
							player.knockbackR += 360;
						}
					}
				}
			}

			// Calculate the new posistion of the player
			var newX = player.x + moveX;
			var newY = player.y + moveY;

			// Check if the player collides with the map border
			if(newX < player.radius || newX > (self.mapSize - player.radius) ||
			   newY < player.radius || newY > (self.mapSize - player.radius)) {
				moveX = 0;
				moveY = 0;
				player.speedM = 30;

				player.knockback = true;
				player.knockbackStep = 15;

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
					player.knockbackR = 0;
				}
			}

			// Check if the player is colliding with the safezone
			if(self.collidingRect(player, [self.szX, self.szY, self.szW, self.szH])) {
				// If the player is a defender, make him unable to shoot and damage him
				if(player.team == self.defenders) {
					player.safezone(self.players);
					player.canShoot = false;
				}

				// If the player is a attacker, do this
				else {
					// If the player is carying the flag, finish the game
					if(player.name == self.flagPlayer && !self.restarting) {
						self.restarting = true;
						self.flagPlayer = null;
						console.log("Restating the game");

						setTimeout(function() {
							for(var n in self.players) {
								self.players[n].socket.emit("finished");
							}

							setTimeout(function() {
								self.restarting = false;
							}, 500);
						}, 1000);
					}

					player.safe = true;
				}
			}

			// Else, reset the player
			else {
				player.canShoot = true;
				player.safe = false;
			}

			// Set the player's new location
			player.x += moveX;
			player.y += moveY;

			// Check if the player collides with the flag
			if(self.collidingRect(player, [self.flagX, self.flagY, self.flagW, self.flagH]) && player.team == self.attackers && self.flagPlayer == null && self.teams[1] > 0) {
				// Increase the players flagtime
				player.flagTime++;

				// If no-one was capturing the flag, capture it
				if(self.capturingPlayer == null && self.flagPlayer == null) {
					self.capturingPlayer = player.name;

					for(var n in self.players) {
						self.players[n].socket.emit("capturing", true, player.name, self.captureTime);
					}
				}

				// Set onflag to true when the capturing player is still on the flag
				if(player.name == self.capturingPlayer) {
					self.onFlag = true;
				}

				// Set capturing to true
				self.capturing = true;
			}
			else {
				// Reset the players flagtime
				player.flagTime = 0;
			}

			// Go through all the fuel tanks
			for(var n in self.fueltanks) {
				var tank = self.fueltanks[n];

				// Check with all the players if they're colliding, if so add the boost to them
				for(var i in self.players) {
					var check = self.players[i];

					var dx = tank.x - check.x;
					var dy = tank.y - check.y;

					if(dx > self.maxCalcDistance || dx < -self.maxCalcDistance ||
						dy > self.maxCalcDistance || dy < -self.maxCalcDistance) {
						continue;
					}

					if(Math.sqrt(dx * dx + dy * dy) <= tank.radius + check.radius && check.boost < 100) {
						check.boost += (100 / 15) * tank.fuel;

						// Log that the player collected a fuel tank
						console.log("Player " + check.name + " collected a fuel tank (" + tank.fuel + ")");

						// If the boost is higher than the maximum value, set it to the maximum value
						if(check.boost > 100) {
							check.boost = 100;
						}

						if(Math.round(check.boost / (100 / 15)) != check.clientBoost) {
							check.clientBoost = Math.round(check.boost / (100 / 15));
							check.socket.emit("stat", "boost", check.clientBoost);
						}

						// Send that the fuel tank has been removed
						for(var n in self.players) {
							self.players[n].socket.emit("fuel_remove", Math.round(tank.x), Math.round(tank.y));
						}

						// Remove the fuel tanks
						for(var n in self.fueltanks) {
							if(self.fueltanks[n] == tank) {
								self.fueltanks.splice(n, 1);
							}
						}
					}
				}
			}
		}

		// Update if all the players are shooting
		for(var n in self.players) {
			var player = self.players[n];

			// Heal the player
			player.heal(self.players);

			// Go through if the player is shooting
			if(player.shooting && player.heat < 20 && !player.cooling_down && !player.isBoosting && player.canShoot) {
				var x1 = player.x;
				var y1 = player.y;

				// Calculate the location of the turret
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

				// Calculate the ending location of the bullet
				var x2 = (self.bulletDistance * Math.cos((player.r - self.extraR) * self.deg)) + x1;
				var y2 = (self.bulletDistance * Math.sin((player.r - self.extraR) * self.deg)) + y1;

				// Check with all the players if their in the bullets path
				for(var n in self.players) {
					var check = self.players[n];

					if(check == player || check.team == player.team) {
						continue;
					}

					var dx = player.x - check.x;
					var dy = player.y - check.y;

					if(dx > 3000 || dx < -3000 ||
						dy > 3000 || dy < -3000) {
						continue;
					}

					if(collide([x1, y1], [x2, y2], [check.x, check.y], check.radius)) {
						var died = check.hit(player, self.players);

						// If the player died, go through
						if(died) {
							player.boost += check.boost;

							if(player.boost > 100) {
								player.boost = 100;
							}

							if(Math.round(player.boost / (100 / 15)) != player.clientBoost) {
								player.clientBoost = Math.round(player.boost / (100 / 15));
								player.socket.emit("stat", "boost", player.clientBoost);
							}

							// If the player has the flag, reset it
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

				// Shoot the bullet
				player.shoot(self.players);
			}
			else {
				// Cooldown the player's heat
				player.cool();
			}
		}

		// Update the players for every player
		for(var n in self.players) {
			self.players[n].updatePlayers(self.players);
		}
		for(var n in self.players) {
			self.players[n].updateMyself();
		}

		// Go through if someone is capturing the flag
		if(self.capturing) {
			// If the person that was on the flag went away, do this
			if(!self.onFlag) {
				// Sort the players based on flag time
				var sorted = self.players.sort(function(a, b) {
					return a.flagTime - b.flagTime;
				});

				// If the list was empty or the highest player hasn't been on the flag, stop the capturing
				if(sorted.length == 0 || sorted[0].flagTime == 0) {
					for(var n in self.players) {
						self.players[n].socket.emit("capturing", false);
					}
					self.capturingPlayer = null;
					self.captureTime = self.maxCaptureTime;
					return;
				}

				// Else, set the capturing player to the highest player in the list
				self.capturingPlayer = sorted[0].name;

				// Reset the capture time
				self.captureTime = self.maxCaptureTime;

				// Update the player for everyone
				for(var n in self.players) {
					self.players[n].socket.emit("capturing", true, self.capturingPlayer.name, self.captureTime);
				}
			}

			// Reset onflag
			self.onFlag = false;

			// If the player is still capturing, decrease the capture time
			if(self.captureTime > 0 && self.flagPlayer == null) {
				self.captureTime--;
			}

			// If the capture time is done, give the flag to the player
			else if(self.flagPlayer == null) {
				// Set the flag player to the capturing player
				self.flagPlayer = self.capturingPlayer;

				// Reset everything
				self.capturingPlayer = null;
				self.captureTime = self.maxCaptureTime;
				self.capturing = false;
				self.onFlag = false;

				// Log that the flag has been captured
				console.log("Player " + self.flagPlayer + " captured the flag");

				// Update the flag player for everyone
				for(var n in self.players) {
					self.players[n].socket.emit("captured", self.flagPlayer, true);
				}
			}
		}
	}

	// Start the gameloop
	gameloop.gameloop(self.update);

	// All the packet handeling for the server
	io.on('connection', function(socket) {

		// A player is joining the server
		socket.on('join', function(name) {
			// If the server is full, kick the user
			if(self.players.length > 20) {
				socket.emit("kicked", "Server is full!");
				return;
			}

			// If the name was null, generate a random name
			if(name == null || name == "") {
				name = namegenerator.generate();
			}

			// Replace some brackets to avoid XSS
			name = name.replaceAll("<", "&lt;");
			name = name.replaceAll(">", "&gt;");

			// If a name has a space in it, the name is invalid
			if(name.includes(" ")) {
				socket.emit("kicked", "Name is invalid!");
				return;
			}

			// Check if the name isn't used and the player doesn't have an already existing socket
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

			// Pick the player's team
			p.team = self.teamPicker();

			// Send that player has joined
			socket.emit("joined", p.name);

			// Generate the location for the player
			p.generateLocation(self.players, self.mapSize, self.szX, self.szY, self.szW, self.szH);

			// Send all the players data around
			for(var n in self.players) {
				var check = self.players[n];

				check.socket.emit("spawn", name, p.x, p.y, p.r, p.team);
				socket.emit("spawn", 
					check.name, 
					Math.round(check.x), 
					Math.round(check.y), 
					Math.round(check.r), 
					check.team);
				socket.emit("kills", check.name, check.kills);
			}

			// Send the data for the fueltanks
			for(var n in self.fueltanks) {
				socket.emit("fuel_spawn", 
					Math.round(self.fueltanks[n].x), 
					Math.round(self.fueltanks[n].y), 
					Math.round(self.fueltanks[n].r), 
					self.fueltanks[n].fuel);
			}

			// Send if the flag is being captured or already captured
			if(self.capturing) {
				p.socket.emit("capturing", true, self.capturingPlayer, self.captureTime);
			}
			else if(self.flagPlayer != null) {
				p.socket.emit("captured", self.flagPlayer, true);
			}

			// Add the player to the server
			self.players.push(p);

			// Start the player
			p.start();

			// Send the location to the user
			socket.emit("spawn", p.name, Math.round(p.x), Math.round(p.y), Math.round(p.r), p.team);

			// Log that the player has joined
			console.log("Player " + name + " (" + p.team + ") connected");

			// If there're no defenders send a wait packet to the player
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

		// A player has typed some thing or done some type of input
		socket.on('input', function(button, type) {
			// Get the player by his socket
			var player = self.getPlayer(socket);

			// Set the AFK timer to 0
			player.waitTime = 0;

			// If the button is a target
			if(button == "target") {
				// Check if the value is valid
				if(type > 360 || type < 0) {
					return;
				}

				// Set the target and clear the slowdown
				player.targetR = type;
				player.slowdown = null;
			}

			// If one of the allowed buttons is pressed
			else if(button == 16 || button == 32 || button == 87 || button == 83 || button == 65 || button == 68) {
				player.hold(button, type);
			}

			// If the left mouse button is pressed, set the shooting to the value
			else if(button == -1) {
				player.shooting = type;
			}

			// If the right buttons is pressed, set it to the value
			else if(button == -3) {
				player.hold(button, type);
			}
		});

		// The player clicked on of the upgrade buttons
		socket.on('upgrade', function(upgrade) {
			// Get the player by his socket
			var player = self.getPlayer(socket);

			// Set the AFK timer to 0
			player.waitTime = 0;

			// Execute the exit method
			player.upgrade(upgrade);
		});

		// A player has disconnected
		socket.on('disconnect', function() {
			// Remove user from the players list and all other lists
			for(var n in self.players) {
				if(self.players[n].socket.id == socket.id) {
					// Remove name from list
					namegenerator.removeNumber(self.players[n].name);

					// Log that the player has disconnected
					console.log("Player " + self.players[n].name + " disconnected");

					// Get the player
					var player = self.players[n];

					// Remove from players from the array
					self.players.splice(n, 1);

					// Send the leave packet to everyone
					for(var n in self.players) {
						self.players[n].socket.emit("leave", player.name);
					}

					// If the player was the player that had the flag, go through
					if(player.name == self.flagPlayer) {
						// Log that the flag has been lost
						console.log("Player " + self.flagPlayer + " lost the flag");

						// Send that the flag has been lost
						for(var n in self.players) {
							self.players[n].socket.emit("captured", self.flagPlayer, false);
						}

						// Clear the current flag player
						self.flagPlayer = null;
					}

					// Set the team to it's value without the player
					self.teams[player.team]--;

					// If there're no defenders left, set the wait to true and clear the flag
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