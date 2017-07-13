var statrow = function(element) {
	var self = {};
	self.element = element;
	self.n = 0;
	self.items = [];
	self.max = 14; 

	self.fill = function(heat = false) {
		self.element.innerHTML = "";

		for(var i = 0; i < self.max; i++) {
			var el = document.createElement('div');

			if(!heat) {
				el.style.borderColor = self.element.getAttribute("color");
				el.style.background = self.element.getAttribute("color");
			}
			else {
				el.style.borderColor = "rgb(255, " + (255 - ((255 / (self.max + 1)) * i)) + ", 0)";
				el.style.background = "rgb(255, " + (255 - ((255 / (self.max + 1)) * i)) + ", 0)";
			}

			el.className = "item inactive";

			self.element.appendChild(el);
			self.items[i] = el;
		}
	}

	self.add = function(n) {
		if((self.n + n) > self.max) {
			n = self.max - self.n;
		}

		for(var i = self.n; i < self.n + n; i++) {
			self.items[i].className = "item active";
		}

		self.n += n;
	}

	self.remove = function(n) {
		if((self.n - n) <= 0) {
			n = self.n;
		}

		for(var i = self.n - n; i < self.n; i++) {
			self.items[i].className = "item inactive";
		}

		self.n -= n;
	}

	self.set = function(n) {
		n -= 1;

		if(n > self.n) {
			self.add(n - self.n);
		}
		else if(n < self.n) {
			self.remove(self.n - n);
		}
	}

	return self;
}