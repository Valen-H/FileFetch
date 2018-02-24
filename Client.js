const http = require("http"), fs = require("fs-extra"), url = require("url"), stream = require("stream");
var client;
module.exports = client = function client({ of, pass, from, to, silence, ignores } = { of: process.env.of || process.env.app || process.argv[2] || "http://127.0.0.1:8080", pass: process.env.pass || "herokujspass", from: process.env.from || "./", to: process.env.to || "out/", silence: process.env.silence, ignores: process.env.ignore || process.env.ignores || [ "./out", "./node_modules", "./.heroku" ] }) {
	var clt, console = global.console;
	//localize console
	of = of.replace(/^https/gmi, "http")
	if (silence) console = new console.constructor(new stream.Writable(), new stream.Writable());
	//redirect local console to null stream, silencing
	var load = function load(those = to, send = from) {
		function dive(src = "./") {
			var list = [];
			if (!src.endsWith("/")) src += "/";
			try {
				var dir = fs.readdirSync(src);
			} catch(ignore) {}
			(dir || [ ]).forEach(file => {
				if (fs.statSync(src + file).isFile()) {
					list.push(src + file);
				} else {
					list = list.concat(dive(src + file + "/"));
				}
			});
			return list
		}//dive
		var files = dive(those);
		return Promise.all(files.map(file => {
			return new Promise((rsl, rjc) => {
				fs.createReadStream(file).pipe(post = http.request({host: url.parse(of).hostname, port: url.parse(of).port, method: "POST", path: `/store?path=${send + file}&pass=${pass}`}, post => {
					post.on("error", rjc);
					setTimeout(rsl, 300, true);
					//non-blocking necessity
				}).on("error", console.error));
			});
		})).then(() => {
			console.info("Load Finished.");
		}).catch(console.warn);
	}//load
	clt = http.get(`${of}/socket?pass=${pass}`, conn => {
		conn.socket.setKeepAlive(true);
		clt.connect = conn;
		clt.load = conn.load = load;
		clt.reload = conn.reload = dt => conn.emit("data", dt);
		clt.connect.send = (event, data) => {
			conn.write(event + (data ? ":" + data : data));
			clt.emit("emitted", event + (data ? ":" + data : data));
			clt.connect.emit("emitted", event + (data ? ":" + data : data));
			if (clt.event) clt.event.emit("emitted", event + (data ? ":" + data : data));
		};
		conn.on("data", chunk => {
			if (/reload/i.test(chunk)) {
				fs.emptyDirSync(to);
				conn.emit("started", chunk);
				clt.emit("started", chunk);
				if (clt.event) clt.event.emit("started", chunk);
				folder(from, to).then(() => {
					console.info("Export Finished.");
					conn.emit("finished", chunk);
					clt.emit("finished", chunk);
					if (clt.event) clt.event.emit("finished", chunk);
				}).catch(err => {
					console.warn(err);
					return false;
				});
				console.info(`files of ${of}/${from} are being extracted to ${to}`);
			} else if (/load/i.test(chunk)) {
				conn.load();
				clt.emit("load", chunk);
				clt.connect.emit("load", chunk);
				if (clt.event) clt.event.emit("load", chunk);
			}
		}).on("error", console.error).on("end", data => clt.connect.emit("closed", data));
		clt.connect.emit("connected", conn);
		clt.emit("connected", conn);
		if (clt.event) clt.event.emit("connected", conn);
	}).on("error", console.error);
	clt.events = function() {
		var ev = http.request({ host: url.parse(of).hostname, port: url.parse(of).port, path: `/event?pass=${pass}`, method: "POST" }, conn => {
			conn.socket.setKeepAlive(true);
			clt.event = conn;
			//clt.send = clt.event.send = (event, data) => http.get({ host: url.parse(of).hostname, port: url.parse(of).port, path: `/event?data=${event + (data ? ":" + data : "")}` }, ignore => clt.emit("emited"));
			clt.send = clt.event.send = (event, data) => {
				ev.write(event + (data ? ":" + data : data));
				clt.emit("emitted", event + (data ? ":" + data : data));
				clt.event.emit("emitted", event + (data ? ":" + data : data));
				if (clt.connect) clt.connect.emit("emitted", event + (data ? ":" + data : data));
			};
			if (clt.connect) clt.connect.send = clt.event.send;
			clt.emit("listen", conn);
			clt.event.emit("listen", conn);
			conn.on("data", dt => {
				let data = [dt.toString().split(":")[0], dt.toString().split(":").slice(1).join("")];
				clt.emit(data[0], data[1]);
				if (clt.connect) clt.connect.emit(data[0], data[1]);
				if (clt.connect) clt.connect.emit("received", dt);
				clt.emit("received", dt);
				clt.event.emit("received", dt);
			}).on("error", console.error).on("end", data => ev.emit("closed", data));
		}).on("error", console.error);
		ev.write("listen:true");
		return ev;
	};
	clt.events();
	return clt;
	async function folder(path, to) {
		return new Promise((rsl, rjc) => {
			http.get({ host: url.parse(of).hostname, port: url.parse(of).port, path: `/command?pass=${pass}&command=fs.readdirSync('${path}')` }, res => {
				var files = "";
				res.on("data", data => files += data);
				res.on("end", () => {
					if (res.statusCode !== 403) {
						try {
							files = eval("['" + files.replace(/,/g, "','") + "']");
						} catch(crashed) {
							rjc("Server crashed.");
							return false;
						}
						Promise.all(files.map(fil => file(fil, to, path))).then(rsl);
					} else {
						rjc("Wrong password.");
					}
				});
				res.on("error", rjc);
			});
		});
	}//folder
	async function file(fil, to, pp) {
		return new Promise((rsl, rjc) => {
			if (ignores.includes(pp + fil)) {
				console.log(`${pp + fil} ignored.`);
				rsl(true);
				return true;
			}
			http.get({ host: url.parse(of).hostname, port: url.parse(of).port, path:`/command?pass=${pass}&command=try{fs.readFileSync('${pp + fil}')}catch(directory){}` }, rs => {
				var fl = "";
				rs.on("data", data => fl += data);
				rs.on("end", () => {
					if (fl !== "undefined") {
						fs.writeFile(to + fil, fl, err => {
							if (err) {
								rjc(err);
								return false;
							}
							rsl(true);
							console.log(`${pp + fil} exported.`);
						});
					} else {
						fs.mkdir(to + fil, err => {
							if (err) {
								rjc(err);
								return false;
							}
							folder(pp + fil + "/", to + fil + "/").then(rsl).catch(rjc);
						});
					}
				});
				//no pipes to handle undefined
				rs.on("error", rjc);
			});
		});
	}//file
}//client
