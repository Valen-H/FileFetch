var http = require("http"), fs = require("fs-extra"), url = require("url"), stream = require("stream")
module.exports = Client = function Client({ of, pass, from, to, silence, ignores } = { of: process.env.of || process.env.app || "http://127.0.0.1:8080", pass: process.env.pass || "herokujspass", from: process.env.from || "./", to: process.env.to || "out/", silence: process.env.silence, ignores: process.env.ignore || [ "./out", "./node_modules", "./.heroku" ] }) {
	var console = global.console
	if (silence) console = new console.constructor(new stream.Writable(), new stream.Writable());
	var load = function load(those = to, send = from) {
		function dive(src = "./") {
			var list = []
			if (!src.endsWith("/")) src += "/"
			try {
				var dir = fs.readdirSync(src)
			} catch(ignore) {}
			(dir || [ ]).forEach(file => {
				if (fs.statSync(src + file).isFile()) {
					list.push(src + file)
				} else {
					list = list.concat(dive(src + file + "/"))
				}
			})
			return list
		}//dive
		var files = dive(those)
		return Promise.all(files.map(file => {
			return new Promise((rsl, rjc) => {
				var post;
				fs.createReadStream(file).pipe(post = http.request({host: url.parse(of).hostname, port: url.parse(of).port, method: "POST", path: `/store?path=${send + file}&pass=${pass}`}, post => {
					post.on("end", () => {
						rsl(true)
					}).on("error", rjc)
				})).on("finish", () => post.end())
			})
		})).then(() => {
			console.info("Load Finished.")
		}).catch(console.warn)
	}
	return http.get(`${of}/socket?pass=${pass}`, conn => {
		conn.socket.setKeepAlive(true)
		if (global.connect) conn.load = global.connect.load = load
		conn.on("data", chunk => {
			fs.emptyDirSync(to)
			if (connect.emit) connect.emit("started")
			Folder(from,to).then(() => {
				console.info("Export Finished.")
				if (connect.emit) connect.emit("finished")
			}).catch(err => {
				console.warn(err)
				process.exit(0)
			})
			console.info(`Files of ${of}/${from} are being extracted to ${to}`)
		})
	})
	async function Folder(path, to) {
		return new Promise((rsl, rjc) => {
			http.get({ host: url.parse(of).hostname, port: url.parse(of).port, path: `/command?pass=${pass}&command=fs.readdirSync('${path}')` }, res => {
				var files = ""
				res.on("data", data => files += data)
				res.on("end", () => {
					if (res.statusCode !== 403) {
						try {
							files = eval("['" + files.replace(/,/g, "','") + "']")
						} catch(crashed) {
							rjc("Server crashed.")
							return
						}
						Promise.all(files.map(fil => File(fil, to, path))).then(() => rsl(true))
					} else {
						rjc("Wrong password.")
					}
				})
			})
		})
	}//Folder
	async function File(file, to, pp) {
		return new Promise((rsl, rjc) => {
			if (ignores.includes(pp + file)) {
				console.log(`${pp + file} ignored.`)
				rsl(true)
				return
			}
			http.get({ host: url.parse(of).hostname, port: url.parse(of).port, path:`/command?pass=${pass}&command=try{fs.readFileSync('${pp + file}')}catch(directory){}` }, rs => {
				var fil = ""
				rs.on("data", data => fil += data)
				rs.on("end", () => {
					if (fil != "undefined") {
						fs.writeFile(to + file, fil, () => {
							rsl(true)
							console.log(`${pp + file} exported.`)
						})
					} else {
						fs.mkdir(to + file, err => {
							if (err) return
							Folder(pp + file + "/", to + file + "/").then(() => rsl(true))
						})
					}
				})
			})
		})
	}//File
}//Client
