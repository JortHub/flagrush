module.exports = function() {
	var self = {};

	self.users = [];
	self.max = 9999;

	self.generate = function() {
		return "Guest" + self.generateNumber();
	}

	self.generateNumber = function() {
		var n = Math.floor(Math.random() * (self.max + 1));

		if(self.users.indexOf(n) >= 0) {
			return self.generateNumber();
		}
		else {
			self.users.push(n);
			return n;
		}
	}

	self.removeNumber = function(n) {
		if(!n.includes("Guest")) {
			return;
		}

		n = n.replace("Guest", "");

		self.users = self.users.filter(function(el) {
			return el !== n;
		});
	}

	return self;
}