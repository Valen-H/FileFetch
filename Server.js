const http = require("http"), url = require("url"), fs = require("fs-extra")
module.exports = Server = function Server({ port = process.env.port || process.env.npm_package_config_port || 8080, pass = "herokujspass" } = { }) {
	var srv;
	(srv = http.createServer((req, res) => {
		var q = url.parse(req.url, true)
		if (q.query.pass == pass) {
			res.writeHead(200, http["200"])
			if (q.query.command) {
				res.write(new String(eval(decodeURI(q.query.command))).toString())
			}
			if (!/^\/(command|socket|close|ping)$/i.test(q.pathname)) {
				res.write("<h1>SUCCESS</h1>")
			} else if (q.pathname == "/socket") {
				res.write("Connected\n")
				req.socket.setKeepAlive(true)
				global.connect = res
				return
			} else if (q.pathname == "/close") {
				res.write("<h1>CLOSED</h1>")
				srv.close()
			} else if (q.pathname == "/ping") {
				res.write(process.uptime()+"")
			}
		} else {
			res.writeHead(403, http["403"])
			res.write("<h1>FORBIDDEN</h1>")
		}
		res.end("", "utf-8")
	})).listen(port)
	console.info(`Server bound to port ${port}`)
	setInterval(() => {
		http.get({ host: "127.0.0.1", port: port, path: "/ping" }, ignore => { })
	}, 2000*60)
	return srv
}//Server
