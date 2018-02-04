## Purpose  
This module was built for heroku but can run on every machine.  
It was originally made to export previous heroku app files before re-deploying to avoid overriding.  
  
### How it works  
This module launches a server on app and a keepalive client on local,  
every time some change occurs on server-side you simply call ```javascript  
client.reload()  
```
 to instruct the server to send the new data back to the client.  
  
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
**of** : the address of the server, `http://appname.herokuapp.com:port/`  
**from** : the path of extraction, `./` (server)  
**to** : the path of output, `out/` (client)  
**ignores** : the files that should be omitted, `['./out','./node_modules','./.heroku']`  
**silence** : silence extraction-specific logging.  
  
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
  
```javascript  
client.connect.load([to, from])  
```
 <- loads files from client to server.  
```javascript  
(client|server).connect.reload()  
```
 <- fetches data from server to client.  
  
Running on terminal will enable commanding through repl-like readline system.  
*stop/exit* <- quits session  
*reload* <- reloads  
*load* <- loads  
*restart* <- restarts all  
**socket** <- the `{client, server}` object.  
  
***  
  
> note, when a filefetch connection is established both client and server broadcast the 'connected' event on themselves!