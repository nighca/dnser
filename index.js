var config = require('./lib/config'),
	dnsServer = require('./lib/dnsServer'),
	pageServer = require('./lib/pageServer');

if(process.argv[2] === 'silently'){
	console.log = function(){};
}

dnsServer.init();
pageServer.init();