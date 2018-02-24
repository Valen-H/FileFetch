#!/usr/bin/env node
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("line", line => {
	if (/^(stop|exit)$/i.test(line)) {
		process.exit(0);
		return
	} else if (/^reload$/i.test(line)) {
		if (socket.server && socket.connect.length) {
			socket.server.connect[0].write("reload");
		} else if (socket.connect.length) {
			socket.connect[0].write("reload");
		} else {
			socket.event.send("reload");
		}
		line = "'Exporting...'"
	} else if (/^load$/i.test(line) && socket.connect) {
		line = "'Loading...'";
		if (socket.client) {
			socket.client.connect.load();
		} else if (!socket.connect.length) {
			socket.connect.load();
		} else {
			socket.connect[0].load();
		}
	} else if (/^restart$/i.test(line)) {
		console.info("Closing...");
		if (socket.server) {
			socket.server.close();
		} else if (socket.connect.write) {
			socket.close();
		}
		socket = require("./")(process.argv[2] || "both");
		line = "'Restarting...'";
	} else if (/^clea[rn]$/i.test(line)) {
		line = "'\\n'.repeat(50)";
	} else if (/^(close|end)$/i.test(line)) {
		(socket.server || socket).connect.concat((socket.server || socket).events).forEach(conn => conn.end("\r\nCLOSED. \r\n"));
		if (socket.server) {
			socket.server.close();
		} else if (socket.connect.write) {
			socket.close();
		}
		line = "'Closing...'";
	} else if (/^start$/i.test(line)) {
		if (!(socket.server || socket).listening) {
			socket = require("./")(process.argv[2] || "both");
			line = "'Starting...'";
		} else {
			line = "'Running...'";
		}
	}
	process.stdout.write(eval(line) + "\n");
	rl.prompt();
});
process.on("uncaughtException", console.error);
var socket = require("./")(process.argv[2] || "both");
rl.prompt();
