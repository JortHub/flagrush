module.exports = {
	player: function(io, socket, name) {
		// The position and rotation
		this.x = 0;
		this.y = 0;
		this.r = 0;

		// Some socket information
		this.socket = socket;
		this.io = io;

		// The name of the player
		this.name = name;

		// The team and type of the player
		this.team = 0;
		this.type = 0;

		// The current hold buttons
		this.buttons = [];

		// The force the player has
		this.forceX = 0;
		this.forceY = 0;
		this.forceR = 0;


		this.generateLocation = function() {

		}

		this.updatePlayers = function(players) {

		}

		this.hold = function(button, state) {
			this.buttons[button] = state;
		}

		this.isHold = function(button) {
			return button[button];
		}

		this.addForce = function(forceX, forceY, forceZ) {
			this.forceX += forceX;
			this.forceY += forceY;
			this.forceZ += forceZ;
		}

		this.removeForce = function(forceX, forceY, forceZ) {
			this.forceX -= forceX;
			this.forceY -= forceY;
			this.forceZ -= forceZ;
		}

		this.generateLocation();

		return this;
	}
}