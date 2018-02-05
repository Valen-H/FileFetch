const http = require("http"), fs = require("fs-extra"), url = require("url"), stream = require("stream");
var client;
module.exports = client = function client({ of, pass, from, to, silence, ignores } = { of: process.env.of || process.env.app || "http://127.0.0.1:8080", pass: process.env.pass || "herokujspass", from: process.env.from || "./", to: process.env.to || "out/", silence: process.env.silence, ignores: process.env.ignore || [ "./out", "./node_modules", "./.heroku" ] }) {
	var clt, console = global.console;
	//localize console
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
					setTimeout(rsl, 500, true);
					//non-blocking necessity
				}));
			});
		})).then(() => {
			console.info("Load Finished.");
		}).catch(console.warn);
	}//load
	return clt = http.get(`${of}/socket?pass=${pass}`, conn => {
		conn.socket.setKeepAlive(true);
		clt.connect = conn;
		clt.setSocketKeepAlive(true);
		conn.load = load;
		conn.reload = dt => conn.emit("data", dt);
		conn.on("data", chunk => {
			if (/reload/i.test(chunk)) {
				fs.emptyDirSync(to);
				conn.emit("started");
				folder(from, to).then(() => {
					console.info("Export Finished.");
					conn.emit("finished");
				}).catch(err => {
					console.warn(err);
					return false;
				});
				console.info(`files of ${of}/${from} are being extracted to ${to}`);
			} else if (/load/i.test(chunk)) {
				conn.load();
			}
		});
		clt.connect.emit("connected", conn);
		clt.emit("connected", conn);
	});
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
			});
		});
	}//file
}//client
