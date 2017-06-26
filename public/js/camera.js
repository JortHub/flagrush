var camera_ = function(canvas) {
	var self = {};

	self.x = 0;
	self.y = 0;
	self.canvas = canvas;

	self.calcX = function(x) {
		return x + (canvas.width / 2) - self.x;
	}

	self.middleX = function() {
		return canvas.width / 2;
	}

	self.calcY = function(y) {
		return y + (canvas.height / 2) - self.y;
	}

	return self;
}