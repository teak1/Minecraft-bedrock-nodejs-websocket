const handlers = require("./handlers");
var webSocketsServerPort = 1337;
// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');
// list of currently connected clients (users)
var clients = [];
/**
 * Helper function for escaping input strings
 */
/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
	// Not important for us. We're writing WebSocket server,
	// not HTTP server
});
server.listen(webSocketsServerPort, function () {
	console.log((new Date()) + " Server is listening on port " +
		webSocketsServerPort);
});
/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
	// WebSocket server is tied to a HTTP server. WebSocket
	// request is just an enhanced HTTP request. For more info 
	// http://tools.ietf.org/html/rfc6455#page-6
	httpServer: server,
	dropConnectionOnKeepaliveTimeout: false
	// keepalive: true,
	// keepaliveInterval: 1000
});
// This callback function is called every time someone
// tries to connect to the WebSocket server
function newReqId() {
	var template = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
	var chrs = "abcdefghijklmnopqrstuvwxyz0123456789";
	var g = "";
	for (var i = 0; i < template.length; i++) {
		g += (template[i] === "x" ? chrs[Math.floor(Math.random() * chrs.length)] : template[i]);
	};
	g = "00000000-0001-0000-000000000000";
	return g;
}

function req(data) {
	data.header.requestId = newReqId();
	return data;
}

function command(cmd) {

	return JSON.stringify(req({
		"body": {
			"origin": {
				"type": "player" // Where the command originates from
			},
			"commandLine": cmd, // Command name goes here (i.e. for /say, enter "say")
			"version": 1,
			"overload": "default" // If the command has additional overloads defined, you can specify it here
		},
		"header": {
			"requestId": "aaaa",
			"messagePurpose": "commandRequest", // Note that both messagePurpose and messageType are "commandRequest"
			"version": 1,
			"messageType": "commandRequest"
		}
	}));
}
wsServer.on('request', function (request) {
	console.log((new Date()) + ' Connection from origin ' +
		request.origin + '.');
	var connection = request.accept(null, request.origin)
	console.log((new Date()) + ' Connection accepted.');
	var lstdin = process.openStdin();
	lstdin.addListener("data", (d) => {
		// note:  d is an object, and when converted to a string it will
		// end with a linefeed.  so we (rather crudely) account for that  
		// with toString() and then trim()
		if (d.toString().trim() === "") return;
		console.log(d.toString().trim());
		connection.sendUTF(command("say " + d.toString().trim()));
	});
	var types = ["AdditionalContentLoaded", "AgentCommand", "AgentCreated", "ApiInit", "AppPaused", "AppResumed", "AppSuspended", "AwardAchievement", "BlockBroken", "BlockPlaced", "BoardTextUpdated", "BossKilled", "CameraUsed", "CauldronUsed", "ConfigurationChanged", "ConnectionFailed", "CraftingSessionCompleted", "EndOfDay", "EntitySpawned", "FileTransmissionCancelled", "FileTransmissionCompleted", "FileTransmissionStarted", "FirstTimeClientOpen", "FocusGained", "FocusLost", "GameSessionComplete", "GameSessionStart", "HardwareInfo", "HasNewContent", "ItemAcquired", "ItemCrafted", "ItemDestroyed", "ItemDropped", "ItemEnchanted", "ItemSmelted", "ItemUsed", "JoinCanceled", "JukeboxUsed", "LicenseCensus", "MascotCreated", "MenuShown", "MobInteracted", "MobKilled", "MultiplayerConnectionStateChanged", "MultiplayerRoundEnd", "MultiplayerRoundStart", "NpcPropertiesUpdated", "OptionsUpdated", "performanceMetrics", "PackImportStage", "PlayerBounced", "PlayerDied", "PlayerJoin", "PlayerLeave", "PlayerMessage", "PlayerTeleported", "PlayerTransform", "PlayerTravelled", "PortalBuilt", "PortalUsed", "PortfolioExported", "PotionBrewed", "PurchaseAttempt", "PurchaseResolved", "RegionalPopup", "RespondedToAcceptContent", "ScreenChanged", "ScreenHeartbeat", "SignInToEdu", "SignInToXboxLive", "SignOutOfXboxLive", "SpecialMobBuilt", "StartClient", "StartWorld", "TextToSpeechToggled", "UgcDownloadCompleted", "UgcDownloadStarted", "UploadSkin", "VehicleExited", "WorldExported", "WorldFilesListed", "WorldGenerated", "WorldLoaded", "WorldUnloaded"]

	for (var i = 0; i < types.length; i++) {
		connection.sendUTF(
			JSON.stringify(req({
				"body": {
					"eventName": types[i] // Replace with an event name listed below
				},
				"header": {
					"requestId": "aaaa", // UUID
					"messagePurpose": "subscribe",
					"version": 1, // Protocol version (currently 1 as-of 1.0.2)
					"messageType": types[i]
				}
			})));
	}
	// user sent some message
	connection.on('message', function (message) {
		try {
			var event = JSON.parse(message.utf8Data).body;
			if (handlers[event.eventName]) {
				handlers[event.eventName](event.properties, _ => connection.sendUTF(command(_)), JSON.parse(message.utf8Data));
			} else {
				// console.log("UNHANDLED:", event.eventName ? event.eventName : message);
			}
		} catch (e) {}
	});

	setInterval(_ => handlers.tick(f => connection.sendUTF(command(f))), 100);
	// user disconnected
	connection.on('close', function (connection) {});
});