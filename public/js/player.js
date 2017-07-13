var player = function() {
	var self = {};

	self.x = 0;
	self.y = 0;
	self.r = 0;
	self.oldR = 0;
	self.difR = 0;
	self.rotationInterval = 6;
	self.name = "";
	self.moving = false;
	self.team = 0;

	self.kills = 0;

	self.hit = false;
	self.hitTimer = 0;
	self.hitAlpha = 0;

	self.shooting = false;
	self.turret = 0;
	self.shotTimer = 0;

	self.boosting = false;
	self.boostTimer = 0;
	self.hasFlag = false;
	self.flagTime = 0;

	self.setR = function(r) {
		self.oldR = self.r;
		if(r - self.r < 180 && r - self.r > -180) {
			self.difR = r - self.r;
		}
		else if(self.r > r) {
			self.difR = 360 - self.r + r;
		}
		else {
			self.difR = -360 + r - self.r;
		}
	}

	self.oldX = 0;
	self.oldY = 0;
	self.difX = 0;
	self.difY = 0;
	self.positionInterval = 6;

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

		self.r += self.difR / self.rotationInterval;

		if(self.r > 360) {
			self.r -= 360;
		}
		else if(self.r < 0) {
			self.r += 360
		}
	}

	return self;
}