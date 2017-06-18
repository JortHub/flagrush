var viewport = function(canvas) {
	var self = {};

	self.minScale = 1;
	self.maxViewDistance = 1000;
	self.scale = 1;

	self.resize = function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		
		var aspect = (window.innerWidth / window.innerHeight);
		
		if(aspect > 1) { 
			if(canvas.width > (self.minScale * self.maxViewDistance)) {
				self.scale = (canvas.width / self.maxViewDistance);
			}
			else {
				self.scale = self.minScale;
			}
		}
		else {
			if(canvas.height > (self.minScale * self.maxViewDistance)) {
				self.scale = (canvas.height / self.maxViewDistance);
			}
			else {
				self.scale = self.minScale;
			}
		}
	}

	self.resize();

	window.onresize = function() {
		self.resize();
	}

	return self;
}