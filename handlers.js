const Command = require("./commandHandler");
var handlers = {
	PlayerMessage(event, send) {
		if (event.Message[0] === ".") {
			Command.cmd[event.Message.split(" ")[0].replace(/\./, "")](event, send);
		}
	},
	PlayerTransform(event, send) {
		Command.data("Pos", {
			x: event.PosX,
			y: event.PosY,
			z: event.PosZ,
		}, event.ClientId);
	},
	ItemUsed(event, send, raw) {
		console.log(raw);
	},
	tick(send) {
		Command.tick(send);
	}
}

module.exports = handlers;