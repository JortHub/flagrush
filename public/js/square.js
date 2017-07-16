var minimap_button = document.getElementById('minimap-button');
var leaderboard_button = document.getElementById('leaderboard-button');
var settings_button = document.getElementById('settings-button');
var exit_button = document.getElementById('exit-button');

var minimap_square = document.getElementById('square-minimap');
var leaderboard_square = document.getElementById('square-leaderboard');
var settings_square = document.getElementById('square-settings');

var open_menu = 0;

function open_next() {
	open_menu++;

	if(open_menu > 2) {
		open_menu = 2;
	}

	if(open_menu == 0) {
		open_minimap();
	}
	else if(open_menu == 1) {
		open_leaderboard();
	}
	else if(open_menu == 2) {
		open_settings();
	}
}

function open_previous() {
	open_menu--;

	if(open_menu < 0) {
		open_menu = 0;
	}

	if(open_menu == 0) {
		open_minimap();
	}
	else if(open_menu == 1) {
		open_leaderboard();
	}
	else if(open_menu == 2) {
		open_settings();
	}
}

minimap_button.onclick = function() {
	open_minimap();
}

function open_minimap() {
	if(!minimap_button.className.endsWith("active")) {
		minimap_button.className = "game-button active";
		leaderboard_button.className = "game-button";
		settings_button.className = "game-button";

		minimap_square.className = "active";
		leaderboard_square.className = "inactive";
		settings_square.className = "inactive";

		open_menu = 0;
	}
}

leaderboard_button.onclick = function() {
	open_leaderboard();
}

function open_leaderboard() {
	if(!leaderboard_button.className.endsWith("active")) {
		leaderboard_button.className = "game-button active";
		minimap_button.className = "game-button";
		settings_button.className = "game-button";

		leaderboard_square.className = "active";
		minimap_square.className = "inactive";
		settings_square.className = "inactive";

		open_menu = 1;
	}
}

settings_button.onclick = function() {
	open_settings();
}

function open_settings() {
	if(!settings_button.className.endsWith("active")) {
		settings_button.className = "game-button active";
		leaderboard_button.className = "game-button";
		minimap_button.className = "game-button";

		settings_square.className = "active";
		leaderboard_square.className = "inactive";
		minimap_square.className = "inactive";

		open_menu = 2;
	}
}

exit_button.onclick = function() {
	open_exit();
}

function open_exit() {
	restart("You killed yourself");
}
