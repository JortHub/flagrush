var settings_ = function() {
	var self = {};
	self.quality = document.getElementById('quality');
	self.image = document.getElementById('image');
	self.render = document.getElementById('render');
	self.smooth = document.getElementById('smooth');
	self.tps = document.getElementById('tps');
	self.control = document.getElementById('control');
	self.prtsc = document.getElementById('prtsc');
	self.fullsc = document.getElementById('fullsc');

	self.quality.addEventListener("change", function(e) {
		self.set_quality(e.target.value);
	});

	self.image.addEventListener("change", function(e) {
		self.set_image(e.target.value);
	});

	self.render.addEventListener("change", function(e) {
		self.set_render(e.target.value);
	});

	self.smooth.addEventListener("change", function(e) {
		self.set_smooth(e.target.value);
	});

	self.tps.addEventListener("change", function(e) {
		self.set_tps(e.target.value);
	});

	self.prtsc.addEventListener("click", function() {
		self.set_prtsc();
	});

	self.control.addEventListener("change", function(e) {
		self.set_control(e.target.value);
	});

	self.fullsc.addEventListener("click", function() {
		self.set_fullsc();
	});

	self.load = function() {
		if(typeof(Storage) !== 'undefined') {
			var item = localStorage.getItem("quality");
			if(item != null && item != "") {
				self.set_quality(item);
				self.quality.value = item;
			}

			item = localStorage.getItem("image");
			if(item != null && item != "") {
				self.set_image(item);
				self.image.value = item;
			}

			item = localStorage.getItem("render");
			if(item != null && item != "") {
				self.set_render(item);
				self.render.value = item;
			}
			
			item = localStorage.getItem("smooth");
			if(item != null && item != "") {
				self.set_smooth(item);
				self.smooth.value = item;
			}
			
			item = localStorage.getItem("tps");
			if(item != null && item != "") {
				self.set_tps(item);
				self.tps.value = item;
			}

			item = localStorage.getItem("control");
			if(item != null && item != "") {
				self.set_control(item);
				self.control.value = item;
			}
			
		}
	}

	self.save = function() {
		if(typeof(Storage) !== 'undefined') {
			localStorage.setItem("quality", self.quality.value);
			localStorage.setItem("image", self.image.value);
			localStorage.setItem("render", self.render.value);
			localStorage.setItem("smooth", self.smooth.value);
			localStorage.setItem("tps", self.tps.value);
			localStorage.setItem("control", self.control.value);
		}
	}

	self.set_quality = function(value) {
		if(value == null) return;
		if(value == "high") {
			ctx.imageSmoothingQuality = "high";
		}
		else if(value == "medium") {
			ctx.imageSmoothingQuality = "medium";
		}
		else if(value == "low") {
			ctx.imageSmoothingQuality = "low";
		}
	}

	self.set_image = function(value) {
		if(value == null) return;
		if(value == "ultra") {
			img_manager.scale(1);
		}
		else if(value == "high") {
			img_manager.scale(0.75);
		}
		else if(value == "medium") {
			img_manager.scale(0.5);
		}
		else if(value == "low") {
			img_manager.scale(0.25);
		}
	}

	self.set_render = function(value) {
		if(value == null) return;
		if(value == "auto") {
			canvas.style.imageRendering = "auto";
		}
		else if(value == "pixel") {
			canvas.style.imageRendering = "pixelated";
		}
		else if(value == "crisp") {
			canvas.style.imageRendering = "crisp-edges";
		}
	}

	self.set_smooth = function(value) {
		if(value == null) return;
		if(value == "true") {
			ctx.imageSmoothingEnabled = true;
		}
		else if(value == "false") {
			ctx.imageSmoothingEnabled = false;
		}
	}

	self.set_tps = function(value) {
		if(value == null) return;
		if(value > 0) {
			gameloop.tps = value;
		}
	}

	self.set_prtsc = function() {
		window.open(canvas.toDataURL());
	}

	self.set_fullsc = function() {
		var isInFullScreen = (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);

	    var docElm = document.documentElement;
	    if (!isInFullScreen) {
	        if (docElm.requestFullscreen) {
	            docElm.requestFullscreen();
	        } else if (docElm.mozRequestFullScreen) {
	            docElm.mozRequestFullScreen();
	        } else if (docElm.webkitRequestFullScreen) {
	            docElm.webkitRequestFullScreen();
	        } else if (docElm.msRequestFullscreen) {
	            docElm.msRequestFullscreen();
	        }

	        self.fullsc.innerHTML = "close";
	    } else {
	        if (document.exitFullscreen) {
	            document.exitFullscreen();
	        } else if (document.webkitExitFullscreen) {
	            document.webkitExitFullscreen();
	        } else if (document.mozCancelFullScreen) {
	            document.mozCancelFullScreen();
	        } else if (document.msExitFullscreen) {
	            document.msExitFullscreen();
	        }

	        self.fullsc.innerHTML = "open";
	    }
	}

	self.set_control = function(e) {
		use_mouse = e == "mouse";
	}

	return self;
}