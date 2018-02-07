const http = require("http"), url = require("url"), fs = require("fs-extra"), stream = require("stream");
const PING_INTERVAL = 5000;
module.exports = function server({ port = process.env.port || process.env.npm_package_config_port || 8080, pass = "herokujspass", silence = false, ping = PING_INTERVAL } = { }) {
	var srv, console = global.console;
	//localize console
	if (silence) console = new console.constructor(new stream.Writable(), new stream.Writable());
	//redirect local console to null stream, silencing
	(srv = http.createServer((req, res) => {
		var q = url.parse(req.url, true);
		if (q.query.pass == pass) {
			res.writeHead(200, http["200"]);
			if (q.query.command) {
				res.write(String(eval(decodeURI(q.query.command))).toString());
			}
			if (!/^\/?(command|socket|close|ping|store)$/i.test(q.pathname)) {
				res.write("<h1>SUCCESS</h1>");
			} else if (q.pathname == "/socket") {
				req.setKeepAlive(true);
				res.write("reload");
				console.info(`${req.socket.remoteAddress} Listening.`);
				res.reload = dt => res.write(dt || "reload");
				res.load = dt => res.write("load");
				srv.connect.push(res);
				res.emit("connected");
				srv.emit("connected", res);
				return true;
			} else if (q.pathname == "/close") {
				res.end("<h1>CLOSED</h1>");
				srv.emit("closed");
				res.emit("closed");
				console.info("Server Closed.");
				srv.close();
				return true;
			} else if (q.pathname == "/ping") {
				res.write(process.uptime() + "");
				srv.emit("pinged");
				res.emit("pinged");
			} else if (q.pathname == "/store") {
				fs.ensureFileSync(q.query.path);
				req.pipe(fs.createWriteStream(q.query.path || "store.txt"));
				res.write("loaded");
				res.emit("loaded");
				srv.emit("loaded");
				console.info(`${q.query.path} Loaded.`);
			} else if (q.pathname == "/event") {
				req.on("data", srv.emit);
				req.setKeepAlive(true);
				srv.events.push(res);
				res.send = (event, data) => res.write(event + (data ? ":" + data : ""));
				res.send("listen");
				res.emit("listen");
				srv.emit("listen");
				console.info(`${req.socket.remoteAddress} listening to events.`);
				return true;
			}
		} else {
			res.writeHead(403, http["403"]);
			res.write("<h1>FORBIDDEN</h1>");
		}
		res.end("", "utf-8");
	})).listen(port, () => {
		console.info(`Server bound to port ${port}`);
	});
	srv.connect = [];
	srv.events = [];
	if (ping) {
		setInterval(() => {
			http.get({ host: "127.0.0.1", port: port, path: "/ping" }, ignore => { });
		}, ping);
	}
	return srv;
}//server
