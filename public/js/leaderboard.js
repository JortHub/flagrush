var leaderboard_ = function() {
	var self = {};
	self.rank = document.getElementById('you-rank');
	self.amount = document.getElementById('you-amount');
	self.rows = document.getElementById('leaderboard-rows');

	self.update = function(players, me) {
		if(players == null || players.length == 0) {
			return;
		}

		var sorted = players.sort(function(a, b) {
			return b.kills - a.kills;
		});
		var children = self.rows.children;
		var place = 0;

		for(var i = 0; i < children.length; i++) {
			var child = children[i];
			var n = sorted[i];

			if(n != null) {
				if(child.style.display == "none") {
					child.style.display = "block";
				}

				if(n == me) {
					place = i + 1;
				}

				child.getElementsByClassName('name')[0].innerHTML = n.name;
				child.getElementsByClassName('amount')[0].innerHTML = n.kills;
			}
			else {
				child.style.display = "none";
			}
		}

		self.rank.innerHTML = place + " of " + sorted.length;

		if(me.kills > 1 || me.kills == 0) {
			self.amount.innerHTML = "with " + me.kills + " kills";
		}
		else {
			self.amount.innerHTML = "with " + me.kills + " kill";
		}
	}

	return self;
}