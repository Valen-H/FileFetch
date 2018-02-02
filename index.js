try {
	require("./nodemodule")
} catch (optionalIgnore) {}
if (typeof connect === "undefined") connect = {}
module.exports = function(type = "client", options) {
	if (/^(server|both)$/i.test(type)) {
		var server = require("./Server.js")(options)
		if (!/^both$/i.test(type)) {
			return server
		}
	}
	if (/^(client|both)$/i.test(type)) {
		var client = require("./Client.js")(options)
		if (!/^both$/i.test(type)) {
			return client
		}
	}
	return connect
};
