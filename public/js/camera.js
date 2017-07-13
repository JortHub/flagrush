var camera_ = function(canvas, viewport) {
	var self = {};

	self.x = 0;
	self.y = 0;
	self.canvas = canvas;
	self.positionInterval = 6;
	self.oldX = 0;
	self.oldY = 0;
	self.difX = 0;
	self.difY = 0;
	self.viewport = viewport;

	self.setX = function(x) {
		self.oldX = self.x;
		self.difX = x - self.x;
	}

	self.setY = function(y) {
		self.oldY = self.y;
		self.difY = y - self.y;
	}

	self.update = function() {
		self.x += self.difX / self.positionInterval;
		self.y += self.difY / self.positionInterval;
	}

	self.calcX = function(x) {
		return Math.floor((x * viewport.scale + (canvas.width / 2) - self.x * viewport.scale));
	}

	self.calcY = function(y) {
		return Math.floor((y * viewport.scale + (canvas.height / 2) - self.y * viewport.scale));
	}

	self.halfX = function() {
		return  Math.floor((canvas.width / 2) / viewport.scale);
	}

	self.halfY = function() {
		return  Math.floor((canvas.height / 2) / viewport.scale);
	}

	self.calc = function(n) {
		return Math.floor(n * viewport.scale);
	}

	self.middleX = function() {
		return (canvas.width / 2);
	}

	self.middleY = function() {
		return (canvas.height / 2);
	}

	return self;
}