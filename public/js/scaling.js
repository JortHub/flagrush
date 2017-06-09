var viewport = function(canvas) {
	this.minScale = 1;
	this.maxViewDistance = 1000;
	this.scale = 1;

	this.resize = function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		
		var aspect = (window.innerWidth / window.innerHeight);
		
		if(aspect > 1) { 
			if(canvas.width > (this.minScale * this.maxViewDistance)) {
				this.scale = (canvas.width / this.maxViewDistance);
			}
			else {
				this.scale = this.minScale;
			}
		}
		else {
			if(canvas.height > (this.minScale * this.maxViewDistance)) {
				this.scale = (canvas.height / this.maxViewDistance);
			}
			else {
				this.scale = this.minScale;
			}
		}
	}

	this.resize();

	window.onresize = function() {
		this.resize();
	}

	return this;
}