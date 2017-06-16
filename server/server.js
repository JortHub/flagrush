module.exports = function(io) {
	var namegenerator = require('./namegenerator')();
	var player = require('./player');
	var players = [];
	var gameloop = require('./gameloop').gameloop(players);

	this.getPlayer = function(socket) {
		for(var n in players) {
			if(socket.id == players[n].socket.id) {
				return players[n];
			}
		}
	}

	io.on('connection', function(socket) {
		/***** Handle packets *****/

		// A player is joining the server
		socket.on('join', function(name) {
			// If the name was null, generate a random name
			if(name == null) {
				name = generate();
			}

			var used = false;
			var s = false;
			for(var n in players) {
				// Check if name is already used
				if(players[n].name == name) {
					used = true;
				}

				// Check if user already has a player object
				if(players[n].socket.id == socket.id) {
					s = true;
				}
			}

			if(!used && !s) {
				// Create a new user
				players.push(new player.player(io, socket, name));

				// Send that player has joined
				socket.emit("joined");

				console.log("Player connected: " + name);
			}
			else if(!s) {
				// The player has been kicked since the name was already used
				socket.emit("kicked", "Name is already used!");
			}
		});

		// A player has typed some thing or done some type of input
		socket.on('input', function(button, type) {
			var player = this.getPlayer(socket);

			if(button == "W" || button == "S" || button == "A" || button == "D") {
				player.hold(button, type);
			}
		});

		// A player has disconnected
		socket.on('disconnect', function() {
			// Remove user from the players list and all other lists
			for(var n in players) {
				if(players[n].socket == socket) {
					// Remove name from list
					removeNumber(players[n].name);

					console.log("Player disconnected: " + players[n].name);

					// Remove from players
					players.splice(n, n + 1);
				}
			}
		});
	});

	
}