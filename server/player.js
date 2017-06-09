module.exports = {
	newPlayer: function(io, socket, name) {
		this.x = 0;
		this.y = 0;
		this.socket = socket;
		this.name = name;

		this.generateLocation = function() {

		}

		this.generateLocation();

		return this;
	}
}