const http = require("http"), url = require("url"), fs = require("fs-extra"), stream = require("stream")
module.exports = Server = function Server({ port = process.env.port || process.env.npm_package_config_port || 8080, pass = "herokujspass", silence = false } = { }) {
	var srv;
	var console = global.console
	if (silence) console = new console.constructor(new stream.Writable(), new stream.Writable());
	(srv = http.createServer((req, res) => {
		var q = url.parse(req.url, true)
		if (q.query.pass == pass) {
			res.writeHead(200, http["200"])
			if (q.query.command) {
				res.write(new String(eval(decodeURI(q.query.command))).toString())
			}
			if (!/^\/?(command|socket|close|ping|store)$/i.test(q.pathname)) {
				res.write("<h1>SUCCESS</h1>")
			} else if (q.pathname == "/socket") {
				res.write("Connected\n")
				console.info("%s Listening.", req.socket.remoteAddress)
				srv.emit("connected")
				global.connect = res
				return
			} else if (q.pathname == "/close") {
				res.write("<h1>CLOSED</h1>")
				srv.emit("closed")
				console.info("Server Closed.")
				srv.close()
			} else if (q.pathname == "/ping") {
				res.write(process.uptime() + "")
				srv.emit("pinged")
			} else if (q.pathname == "/store") {
				fs.ensureFileSync(q.query.path)
				req.pipe(fs.createWriteStream(q.query.path || "store.txt"))
				res.write("Loaded.")
				console.info("%s Loaded.", q.query.path)
			}
		} else {
			res.writeHead(403, http["403"])
			res.write("<h1>FORBIDDEN</h1>")
		}
		res.end("", "utf-8")
	})).listen(port, () => {
		console.info(`Listening to ${port}`)
	})
	console.info(`Server bound to port ${port}`)
	setInterval(() => {
		http.get({ host: "127.0.0.1", port: port, path: "/ping" }, ignore => { })
	}, 2000 * 60)
	return srv
}//Server
