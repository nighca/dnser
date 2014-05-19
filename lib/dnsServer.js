var dgram = require("dgram"),
    NDP = require('native-dns-packet'),
    util = require("./util"),
    config = require("./config"),
    map = require("./map");

var parseMsg = function(msg){
    try{
        return NDP.parse(msg);
    }catch(e){
        console.error('Parse error: ', e);
        console.log('Msg: ', msg.toString());
        return null;
    }
};

function init() {
    dgram.createSocket("udp4", function(msg, rinfo) {
        //console.log('Request from: ', rinfo.address);

        var req = parseMsg(msg);
        if(!req){
            console.log('Invalid request.');
            return;
        }

        var question = req.question[0],
            domain = question.name,
            customAnswer;
        if (!/.*\..*/.test(domain)) {
            console.error('Question invalid domain:', domain);
            return;
        }

        //console.log('Question domain: ', domain);
        //console.log('Rinfo: ', rinfo);
        //console.log('Req: ', req);

        var server = this,
            address = rinfo.address,
            id = map.mac(address),
            port = rinfo.port,
            size = rinfo.size;

        var cfg = config.config(),
            setting = cfg.clients[id],
            customList = (setting && setting.customList) || [];

        // 服务器本身
        //console.log(cfg);
        if(cfg.selfDomains && (cfg.selfDomains.indexOf(domain) >= 0)){
            console.log('Caught!', domain);
            customAnswer = cfg.selfAddress;
        }

        // 检查规则
        util.forEach(customList, function(info){
            //console.log('Check rule:', domain, info.rule, info.pattern);
            if(info.pattern.test(domain)){
                console.log('Caught!', info.address);
                customAnswer = info.address;
                return false;
            }
        });

        // 若规则生效，直接构造response
        var validIpdPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        if(customAnswer && validIpdPattern.test(customAnswer)){
            var resp = req;
            resp.header.qr = 1;
            resp.header.ra = 1;
            resp.answer = [{
                name: domain,
                type: 1,
                'class': 1,
                ttl: 10,
                address : customAnswer
            }];

            //console.log('Custom resp: ', resp);

            msg = new Buffer(200);
            NDP.write(msg, resp);
            server.send(msg, 0, msg.length, port, address);

            return;
        }

        // 否则，代理请求
        dgram.createSocket("udp4", function(msg, rinfo) {
            server.send(msg, 0, rinfo.size, port, address);
            this.close();
        }).send(msg, 0, size, cfg.remoteDNSServer.port, cfg.remoteDNSServer.host);

    }).on("error", function(error) {
        console.error('Listen error: ', error);
    }).bind(53);
    console.log('DNS Server on port ' + 53);
}

module.exports = {
    init: init
};