# Purpose  
This module was built for heroku but can run on every machine.  
It was originally made to export previous heroku app files before re-deploying to avoid overriding.  
  
## How it works  
This module launcher a server on app and a keepalive client on local,  
every time some change occurs on server-side you simply call `global.connect.write("Reload.")` to instruct the server to send the new data back to the client.  
  
### Usage
import on app,  
`require('filefetch')(type, options)`  
*type \<String> = client|server|both*  
this defines the side of the script (use 'both' only for testing purposes...)  
*options \<Object> = {pass,from,of,ignores,silence,port}*  
provide with any order  
Servers use : pass, port  
Clients use : pass, from, of, to, ignores, silence  
pass : the pass provided by client must match server-sided pass with is 'herokujspass' by default  
port : the port that listens to this module, must hold a unique server  
of : the address of the server, `http://appname.herokuapp.com:port/`  
from : the path of extraction, `./` (server)  
to : the path of output, `out/` (client)  
ignores : the files that should be omitted, `['./out','./node_modules','./.heroku']`  
silence : silence extraction-specific logging.  
  
***
  
`npm start` -> `node heroku.js client --no-deprecation`  
`npm run server` -> `node heroku.js server --no-deprecation`  
`npm run both` -> `node heroku.js both --no-deprecation`  
  
`type=client from=... to=... node index.js --no-deprecation`  