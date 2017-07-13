var img = function(name, src) {
	var self = {};
	self.src = src;
	self.img = null;
	self.name = name;
	self.loaded = false;
	self.oWidth = 0;
	self.oHeight = 0;
	self.oImg = null

	self.load = function() {
		self.img = new Image();
		self.img.src = self.src;
		self.img.onload = function() {
			self.loaded = true;
			self.oWidth = self.img.width;
			self.oHeight = self.img.height;
			self.oImg = self.img;
		}
	}

	self.scale = function(scale) {
		var canvas2 = document.createElement('canvas');
		var ctx2 = canvas2.getContext('2d');
		canvas2.width = self.oWidth * scale;
		canvas2.height = self.oHeight * scale;
		ctx2.drawImage(self.oImg, 0, 0, canvas2.width, canvas2.height);
		self.img = (canvas2);
	}

	return self;
}

var img_manager_ = function() {
	var self = {};
	self.imgs = [];

	self.add = function(name, src) {
		return (self.imgs[self.imgs.length] = new img(name, src));
	}

	self.load = function() {
		for(var i = 0; i < self.imgs.length; i++) {
			if(!self.imgs[i].loaded) {
				self.imgs[i].load();
			}
		}
	}

	self.loaded = function() {
		for(var i = 0; i < self.imgs.length; i++) {
			if(!self.imgs[i].loaded) {
				return false;
			}
		}

		return true;
	}

	self.get = function(name) {
		for(var i = 0; i < self.imgs.length; i++) {
			if(self.imgs[i].name = name) {
				return self.imgs[i];
			}
		}

		return null;
	}

	self.scale = function(scale) {
		for(var i = 0; i < self.imgs.length; i++) {
			self.imgs[i].scale(scale);
		}
	}

	return self;
}