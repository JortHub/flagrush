module.exports = function() {

	this.users = [];
	this.max = 9999;

	this.generate = function() {
		return "Guest" + this.generateNumber();
	}

	this.generateNumber = function() {
		var n = Math.floor(Math.random() * (this.max + 1));

		if(this.users.indexOf(n) >= 0) {
			return this.generateNumber();
		}
		else {
			this.users.push(n);
			return n;
		}
	}

	this.removeNumber = function(n) {
		n = n.replace("Guest", "");

		this.users = this.users.filter(function(el) {
			return el !== n;
		});
	}

}