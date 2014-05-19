var http = require('http'),
    fs = require('fs'),
    exec = require('child_process').exec;

var util = require('./util');

var map = {};

var fetchInfo = function(){
    try{
        var leases = fs.readFileSync('/tmp/dhcp.leases', 'utf8');

        leases = leases.split('\n').filter(function(s){
            return s.trim();
        });

        util.forEach(leases, function(lease, i){
            lease = lease.split(' ');
            var mac = lease[1],
                ip = lease[2],
                name = lease[3];

            map[ip] = {
                name: name,
                mac: mac
            };
        });

    }catch(e){
        console.warn('!!!! read/parse /tmp/dhcp.leases fail');
        throw e;
    }
};

fetchInfo();

//setInterval(fetchInfo, 2000);

var getMac = function(ip){
    var info = map[ip];
    return info ? info.mac : null;
};

var getName = function(ip){
    var info = map[ip];
    return info ? info.name : null;
};

var getNameByMac = function(mac){
    var name = null;
    util.forEach(map, function(info){
        if(info.mac === mac){
            name = info.name;
        }
    });

    return name;
};

var getAll = function(){
    return map;
};

module.exports = {
    mac: getMac,
    name: getName,
    all: getAll,
    nameByMac: getNameByMac,
    fetchInfo: fetchInfo
};