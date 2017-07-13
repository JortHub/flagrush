var upgrades_ = function(statrows, callback) {
	var self = {};
	self.statrows = statrows;
	self.callback = callback;
	self.div = document.getElementById("game-upgrades");
	self.levelup = document.getElementById("levelup");

	self.speedButton = document.getElementById("speed-button");
	self.regenButton = document.getElementById("regen-button");
	self.damageButton = document.getElementById("damage-button");

	self.points = 0;

	self.speedButton.addEventListener('click', function() {
		if(self.points > 0 && self.statrows.speed.n < 14) {
			self.points--;
			self.statrows.speed.add(1);

			self.callback("speed");

			if(self.statrows.speed.n == 14) {
				self.speedButton.className == "upgrade inactive";
			}

			self.close();
		}
	});

	self.regenButton.addEventListener('click', function() {
		if(self.points > 0 && self.statrows.regen.n < 14) {
			self.points--;
			self.statrows.regen.add(1);
			
			self.callback("regen");

			if(self.statrows.regen.n == 14) {
				self.regenButton.className == "upgrade inactive";
			}

			self.close();
		}
	});

	self.damageButton.addEventListener('click', function() {
		if(self.points > 0 && self.statrows.damage.n < 14) {
			self.points--;
			self.statrows.damage.add(1);

			self.callback("damage");

			if(self.statrows.damage.n == 14) {
				self.damageButton.className == "upgrade inactive";
			}

			self.close();
		}
	});

	self.close = function() {
		for(var n in document.getElementsByClassName('upgrade')) {
			var el = document.getElementsByClassName('upgrade')[n];

			if(!(el instanceof Element)) {
				continue;
			}

			el.style.display = "none";
		}

		setTimeout(function() {
			self.div.style.display = "none";
			self.levelup.className = "active";

			for(var n in document.getElementsByClassName('upgrade')) {
				var el = document.getElementsByClassName('upgrade')[n];

				if(!(el instanceof Element)) {
					continue;
				}

				el.style.display = "block";
			}
		}, 1000);
	}

	self.upgrade = function() {
		self.div.style.display = "initial";

		for(var n in document.getElementsByClassName('upgrade')) {
			var el = document.getElementsByClassName('upgrade')[n];

			if(!(el instanceof Element)) {
				continue;
			}

			el.style.display = "block";
		}

		setTimeout(function() {
			self.levelup.className = "inactive";
		}, 1500);
	}

	return self;
}