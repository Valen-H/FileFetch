const http = require("http"), url = require("url"), fs = require("fs-extra"), stream = require("stream");
const PING_INTERVAL = 4000;
module.exports = function server({ port = process.env.port || process.env.PORT || process.env.npm_package_config_port || 8080, pass = "herokujspass", silence = false, ping = process.env.ping || PING_INTERVAL } = { }) {
	var srv, console = global.console;
	//localize console
	if (silence) console = new console.constructor(new stream.Writable(), new stream.Writable());
	//redirect local console to null stream, silencing
	(srv = http.createServer((req, res) => {
		var q = url.parse(req.url, true);
		req.on("error", console.error);
		res.on("error", console.error);
		if (q.query.pass == pass) {
			res.writeHead(200, http["200"]);
			if (q.query.command) {
				res.write(String(eval(decodeURI(q.query.command))).toString());
			}
			if (!/^\/?(command|socket|close|ping|store|event)$/i.test(q.pathname)) {
				res.write("<h1>SUCCESS</h1>");
			} else if (q.pathname == "/socket") {
				req.socket.setKeepAlive(true);
				res.write("started");
				console.info(`${req.socket.remoteAddress} Listening.`);
				res.reload = dt => res.write(dt || "reload");
				res.load = dt => res.write("load");
				srv.connect.push(res);
				res.emit("connected", res);
				srv.emit("connected", res);
				return true;
			} else if (q.pathname == "/close") {
				res.end("<h1>CLOSED</h1>");
				srv.emit("closed", srv);
				res.emit("closed", srv);
				console.info("Server Closed.");
				srv.connect.concat(srv.events).forEach(conn => {
					conn.setKeepAlive(false);
					conn.end("\r\nCLOSED. \r\n");
					clearInterval(srv.ping);
				});
				srv.close();
				return true;
			} else if (q.pathname == "/ping") {
				res.write(process.uptime() + "");
				srv.emit("pinged", process.uptime());
				res.emit("pinged", process.uptime());
			} else if (q.pathname == "/store") {
				fs.ensureFileSync(q.query.path);
				req.pipe(fs.createWriteStream(q.query.path || "store.txt"));
				res.write("loaded", q.query.path);
				res.emit("loaded", q.query.path);
				srv.emit("loaded", q.query.path);
				console.info(`${q.query.path} Loaded.`);
			} else if (q.pathname == "/event") {
				/*if (q.query.data) {
					let data = [q.query.data.toString().split(":")[0], q.query.data.toString().split(":").slice(1).join("")];
					srv.emit(data[0], data[1]);
					srv.emit("received", q.query.data);
					return true;
				}*/
				req.socket.setKeepAlive(true);
				srv.events.push(res);
				req.on("data", dt => {
					let data = [dt.toString().split(":")[0], dt.toString().split(":").slice(1).join("")];
					srv.emit(data[0], data[1]);
					res.emit(data[0], data[1]);
					srv.emit("received", dt);
					res.emit("received", dt);
				});
				res.send = (event, data) => {
					res.write(event + (data ? ":" + data : ""));
					res.emit("emitted", event + (data ? ":" + data : data));
					srv.emit("emitted", event + (data ? ":" + data : data));
				};
				res.send("listen", true);
				res.emit("listen");
				srv.emit("listen");
				console.info(`${req.socket.remoteAddress} Listening to events.`);
				return true;
			}
		} else {
			res.writeHead(403, http["403"]);
			res.write("<h1>FORBIDDEN</h1>");
		}
		res.end("", "utf-8");
	})).listen(port, () => {
		console.info(`Server bound to port ${port}`);
	}).on("error", console.error);
	srv.connect = [];
	srv.events = [];
	srv.on("close", () => {
		console.info("Server Closed.");
		srv.emit("closed", srv);
	});
	if (ping) {
		srv.ping = setInterval(() => {
			http.get({ host: process.env.app || "127.0.0.1", port: port, path: "/ping?pass=" + pass }, ignore => { }).once("error", () => clearInterval(srv.ping));
		}, ping);
	}
	return srv;
}//server
