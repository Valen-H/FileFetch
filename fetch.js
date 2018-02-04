#!/usr/bin/env node --harmony
const readline = require("readline")
const rl = readline.createInterface({ input: process.stdin,output: process.stdout })
rl.on("line", line => {
	if (/^(stop|exit)$/i.test(line)) {
		process.exit(0)
		return
	} else if (/^reload$/i.test(line)) {
		connect.write("Reload.\n")
		line = "'Re-Exporting...'"
	} else if (/^load$/i.test(line)) {
		line = ("'Loading...'")
		connect.load()
	}
	process.stdout.write(eval(line) + "\n")
	rl.prompt()
})
require("./")(process.argv[2] || "both")
rl.prompt()
