#!/usr/bin/env node --harmony
const readline = require("readline")
const rl = readline.createInterface({input:process.stdin,output:process.stdout})
rl.on("line",line=>{
	if (line == "stop") {
		process.exit(0)
		return
	} else if (line == "reload") {
		connect.write("Reload.\n")
		line = "'Re-Exporting...'"
	}
	process.stdout.write(eval(line)+"\n")
	rl.prompt()
})
require("./")(process.argv[2])
rl.prompt()
