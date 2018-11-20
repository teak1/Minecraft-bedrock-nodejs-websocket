function lerp(a, b, n) {
	return a + (b - a) * n;
}

function forceSleep(timems) {
	var start = new Date().getTime();
	while (new Date().getTime() < start + timems) {}
}
var players = {};

function getVal(ClientId, val) {
	players[ClientId] = players[ClientId] || {};
	if (val) return players[ClientId][val];
	return players[ClientId];
}

function setVal(ClientId, name, val) {
	if (val === undefined || name === undefined) return;
	players[ClientId] = players[ClientId] || {};
	players[ClientId][name] = val;
}
module.exports = {
	cmd: {
		addPoint(event, send) {
			console.log(event);
			var pos = getVal(event.ClientId, "Pos");
			if (pos === null) {
				return;
			}
			setVal(event.ClientId, "path", getVal(event.ClientId, "path") || []);
			getVal(event.ClientId, "path").push(pos);
			send(`say set path to (${JSON.stringify(getVal(event.ClientId,"path"))})`);
		}
	},
	data(name, data, id) {
		setVal(id, name, data);
	},
	tick(send) {
		send("kill @e[type=arrow]");
		var l = 1;
		for (var i of Object.keys(players)) {
			var data = players[i];
			data.path = data.path || [];
			l = data.path.length;
			if (data.path.length < 2) continue;
			for (var j = 1; j < data.path.length; j++) {
				var last = data.path[j - 1];
				var next = data.path[j];
				var k = spot % 1;
				if (Math.floor(k) === j) {
					var _ = {
						x: lerp(last.x, next.x, k),
						y: lerp(last.y, next.y, k),
						z: lerp(last.z, next.z, k),
					}
					send(`summon arrow ${_.x} ${_.y} ${_.z}`);
				}
			}
		}
		spot += 0.1;
		spot %= l;
	}
}
var spot = 0;