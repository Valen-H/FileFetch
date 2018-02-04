#!/usr/bin/env node
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("line", line => {
	if (/^(stop|exit)$/i.test(line)) {
		process.exit(0);
		return
	} else if (/^reload$/i.test(line)) {
		if (socket.server) {
			socket.server.connect.write("Reload.\n");
		} else {
			socket.connect.write("Reload.\n");
		}
		line = "'Re-Exporting...'"
	} else if (/^load$/i.test(line)) {
		line = "'Loading...'";
		if (socket.client) {
			socket.client.connect.load();
		} else {
			socket.connect.load();
		}
	} else if (/^restart$/i.test(line)) {
		if (socket.server) {
			socket.server.close();
		} else if (socket.connect.write) {
			socket.close();
		}
		console.info("Server closed.");
		socket = require("./")(process.argv[2] || "both");
		line = "'Restarting...'";
	}
	process.stdout.write(eval(line) + "\n");
	rl.prompt();
})
var socket = require("./")(process.argv[2] || "both");
rl.prompt();
