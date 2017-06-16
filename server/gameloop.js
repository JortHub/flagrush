module.exports = {
	gameloop: function(players) {
		var gameloop = require("node-gameloop");

		var players = players;
		var running = true;
		this.tickLengthMs = 1000 / 20;

		var update = function() {
			if(players.length <= 0) {
				return;
			}

			// Update the forces and so the player's locations

			// Update the players for every player
			for(var n in players) {
				players[n].updatePlayers(players);
			}
		}

		this.loop = function(delta) {
			if(!running) {
				console.log(this);
				gameloop.clearGameLoop(this.id);
				return;
			}

			update();
		}

		this.id = gameloop.setGameLoop(this.loop, this.tickLengthMs);

		return this;
	}
}