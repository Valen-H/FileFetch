var http = require("http"), fs = require("fs-extra"), url = require("url")
module.exports = Client = function Client({of,pass,from,to,silence,ignores}={of:process.env.of||process.env.app||"http://127.0.0.1:8080",pass:process.env.pass||"herokujspass",from:process.env.from||"./",to:process.env.to||"out/",silence:process.env.silence,ignores:process.env.ignore||["./out","./node_modules","./.heroku"]}) {
	return http.get({host:url.parse(of).host.replace(/:\d*$/g,''),port:url.parse(of).port,path:`/socket?pass=${pass}`},conn=>{
		conn.socket.setKeepAlive(true)
		conn.on("data",chunk=>{
			fs.emptyDirSync(to)
			Folder(from,to).then(()=>{console.info("Export Finished.")}).catch(err=>{console.warn(err);process.exit(0)})
			console.info(`Files of ${of}/${from} are being extracted to ${to}`)
		})
	})
	async function Folder(path,to) {
		return new Promise((rsl,rjc)=>{
			http.get({host:url.parse(of).host.replace(/:\d*$/g,''),port:url.parse(of).port,path:`/command?pass=${pass}&command=fs.readdirSync('${path}')`},res=>{
				var files = ""
				res.on("data",data=>files+=data)
				res.on("end",()=>{
					if (res.statusCode!=403) {
						try {
							files = eval("['"+files.replace(/,/g,"','")+"']")
						} catch(crashed) {
							rjc("Server crashed.")
							return
						}
						Promise.all(files.map(fil=>File(fil,to,path))).then(()=>rsl(true))
					} else {
						rjc("Wrong password.")
					}
				})
			})
		})
	}//Folder
	async function File(file,to,pp) {
		return new Promise((rsl,rjc)=>{
			if (ignores.includes(pp+file)) {
				console.log(`${pp+file} ignored.`)
				rsl(true)
				return
			}
			http.get({host:url.parse(of).host.replace(/:\d*$/g,''),port:url.parse(of).port,path:`/command?pass=${pass}&command=try{fs.readFileSync('${pp+file}')}catch(directory){}`},rs=>{
				var fil = ""
				rs.on("data",data=>fil+=data)
				rs.on("end",()=>{
					if (fil != "undefined") {
						fs.writeFile(to+file,fil,()=>{
							rsl(true)
							if (!silence) console.log(`${pp+file} exported.`)
						})
					} else {
						fs.mkdir(to+file).then(err=>{
							if (err) return
							Folder(pp+file+"/",to+file+"/").then(()=>rsl(true))
						})
					}
				})
			})
		})
	}//File
}//Client
