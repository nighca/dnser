var util = require('./util'),
	cfg = require('../config.json');

cfg.clients = cfg.clients || {};

var config = function(params){
	if(params){
		console.log('Config: ', params);
		util.forEach(params, function(value, key){
			cfg[key] = value;
		});
	}

	return cfg;
};

module.exports = {
	config: config
};