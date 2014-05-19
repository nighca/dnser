var path = require('path'),
    http = require('http'),
    express = require('express');

var config = require("./config"),
    util = require("./util"),
    map = require("./map");

var removePattern = function(list){
    return list.map(function(item){
        return {
            address: item.address,
            rule: item.rule
        };
    });
};

var doCustomList = function(id, l){
    var cfg = config.config();

    if(l){
        cfg.clients[id] = {
            customList: l
        };
        config.config(cfg);
    }

    cfg = cfg.clients[id];

    return (cfg && cfg.customList) || [];
};

var getList = function(req, res){
    var ip = req.ip,
        id = req.query.id || map.mac(ip);
    console.log('Get list:', req.ip, 'of:', id);
    res.json({
        err: null,
        data: id ? removePattern(doCustomList(id)) : []
    });
};

var getClients = function(req, res){
    console.log('Get clients:', req.ip);
    var clients = {},
        cfgClients = config.config().clients;
    util.forEach(map.all(), function(client, ip){
        var id = client.mac,
            cfgClient = cfgClients[id];
        clients[id] = {
            name: client.name,
            ip: ip,
            list: (cfgClient && cfgClient.customList) ?
                removePattern(cfgClient.customList) :
                []
        };
    });

    res.json({
        err: null,
        data: clients
    });
};

var refreshClients = function(req, res){
    console.log('Refresh map:', req.ip);
    try{
        map.fetchInfo();
    }catch(e){
        res.json({
            err: e,
            data: null
        });
        return;
    }

    var clients = {},
        cfgClients = config.config().clients;
    util.forEach(map.all(), function(client, ip){
        var id = client.mac,
            cfgClient = cfgClients[id];
        clients[id] = {
            name: client.name,
            ip: ip,
            list: (cfgClient && cfgClient.customList) ?
                removePattern(cfgClient.customList) :
                []
        };
    });

    res.json({
        err: null,
        data: clients
    });
};

var setList = function(req, res){
    var list = req.body.list,
        ip = req.ip,
        id = req.body.id || map.mac(ip);

    console.log('Set list:', ip, 'of:', id);

    if(!list){
        res.json({
            err: 'Not enough arguments!'
        });
        return;
    }
    list = JSON.parse(list).filter(function(item){
        return item.rule || item.address;
    }).map(function(info){
        return {
            rule: info.rule,
            pattern: util.rule2Pattern(info.rule),
            address: info.address
        };
    });

    var customList = removePattern(doCustomList(id, list));

    res.json({
        err: null,
        data: customList
    });
};

var init = function(){
    var cfg = config.config(),
        app = express();

    app.use(express.static(path.join(__dirname, '../static')));

    app.use(require('connect-multiparty')());
    app.use(express.urlencoded());
    app.use(express.json());
    app.use(express.methodOverride());
    app.use(app.router);

    var port = cfg.pageServerPort || 80;
    app.listen(port);
    console.log('Page Server on port ' + port);

    app.get('/list', getList);

    app.post('/list', setList);

    app.get('/clients', getClients);

    app.get('/refresh-clients', refreshClients);
};

module.exports = {
    init: init
};