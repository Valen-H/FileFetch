## Purpose  
This module was built for heroku but can run on every machine.  
It was originally made to export previous heroku app files before re-deploying to avoid overriding.  
  
### How it works  
This module launches a server on app and a keepalive client on local,  
every time some change occurs on server-side you simply call `(client|server)[.connect].reload()` to instruct the server to send the new data back to the client or `(client|server)[.connect].load()` to send new data to server.  
> note that `server.connect` is an array (like `server.events`) and reference to `connect` is optional only on clients.  
  
# Usage
import on app,  
`require('filefetch')(type, options)`  
*type \<String> = client|server|both*  
this defines the side of the script (use 'both' only for testing purposes...)  
*options \<Object> = {pass,from,of,ignores,silence,port}*  
provide with any order  
Servers use : pass, port  
Clients use : pass, from, of, to, ignores, silence  
**pass** : the pass provided by client must match server-sided pass with is 'herokujspass' by default  
**port** : the port that listens to this module, must hold a unique server  
**of** : the address of the server, eg : `http://appname.herokuapp.com:port/`, defaults to : `http://127.0.0.1:8080/`  
**from** : the path of extraction (serverside), default : `./`  
**to** : the path of output (clientside), default : `out/`  
**ignores** : the files that should be omitted, defaults : `['./out','./node_modules','./.heroku']`  
**silence** : silence extraction-specific logging. Defaults to `false`  
  
***
  
On terminal:  
`npm start` -> `npm run client` -> `node fetch.js client --no-deprecation`  
`npm run server` -> `node fetch.js server --no-deprecation`  
`npm run both` -> `node fetch.js both --no-deprecation`  
`npm test` -> `npm install -g` (`run` binary)  
`run [server|client|both|]` -> `node fetch.js`  
You can also pass environmental values:  
`type=client from=... to=... ... npm start`  
  
***  
  
If called as `both` inside a script return type will be a `{client, server}` object while calling it as `client|server` will only return the specified part.  
  
* (a|b) <- `a` or `b`  
* [a] <- optional  
  
`(client|server)[.connect].load([to, from])` <- loads files from client to server.  
`(client|server)[.connect].reload()` <- fetches data from server to client.  
  
> note that `server.connect` is an array (like `server.events`)  
  
Running on terminal will enable commanding through repl-like readline system.  
*stop/exit* <- quits session  
*reload* <- reloads  
*load* <- loads  
*restart* <- restarts all  
*clean/clear* <- clean console  
*socket* <- the `{client, server}` object (or `(client|server)`).  
  
***  
  
#### Events  
  
> note, when an event is emitted both client and server broadcasts the event on themselves and their respective socket(s)!  
  
* Client  
	**started** <- socket issued `reload`  
	**finished** <- socket finished `reload`  
	**load** <- socket issued `load`  
* Both  
	**connected** <- socket connected, triggers on : `(load|reload)`, requests to `/socket`  
	**received** <- socket received event  
	**emitted** <- socket sent event  
	**listen** <- request to `/event`  
* Server  
	**pinged** <- request to `/ping` which returns process.uptime()  
	**closed** <- request to `/close`  
	**loaded** <- `load` commanded, request to `/store?path=...`  
	
> requests to `/event` create a keepAlive socket for events emission... the socket has a `send(event <String>, data <String>)` method which sends events to other side...  
  
***  
  
* Samples  
  
```javascript
	const ff = require("filefetch")
	const ob = ff("both", { port: 8080, pass: "ohai" })
	ob.client.on("log", console.log)
	ob.server.on("listen", () => ob.server.events[0].send("log", 1234))
	ob.client.on("connected", conn => conn.load())
```