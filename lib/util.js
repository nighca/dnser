var type = function(o){
    return Object.prototype.toString.call(o);
};

var forEach = function(object, handler){
    var key, result;

    if(type(object) === '[object Array]'){
        for(var i = 0, l = object.length; i < l; i++){
            if(handler.call(this, object[i], i) === false){
                return;
            }
        }

        return;
    }

    for(key in object){
        if(object.hasOwnProperty(key)){
            if(handler.call(this, object[key], key) === false){
                return;
            }
        }
    }
};

var formatTime = function(d, sep){
    d = d || new Date();
    return [
        d.getFullYear(),
        d.getMonth() + 1,
        d.getDate(),
        d.getHours(),
        d.getMinutes(),
        d.getSeconds()
    ].join(sep || '_');
};

var begin = function(name){
    var begin = Date.now();

    return {
        name: name,
        begin: begin,
        count: function(){
            return Date.now() - begin;
        },
        end: function(){
            return Date.now() - begin;
        }
    };
};

var cache = {
    storage: {},
    register: function(name, getter){
        var getMethod = 'get' + name[0].toUpperCase() + name.slice(1),
            setMethod = 'set' + name[0].toUpperCase() + name.slice(1);

        var storage = this.storage[name] = this.storage[name] || {};
        this[getMethod] = function(key){
            storage[key] = storage[key] || getter.apply(this, arguments);
            return storage[key];
        };
        this[setMethod] = function(key, value){
            storage[key] = value;
            return storage[key];
        };
    }
};

function isString(str) {
    return type(str) === "[object String]";
}

function string2RegExp(str) {
    return isString(str) ? new RegExp(str.replace(/^\/(.+)\/(?:\w*)$/, "$1"), "i") : null;
}

function wildcard2RegExp(str) { /* 将通配符转成正则表达式 */
    return isString(str) ?
        (new RegExp("^" + str.replace(/[^0-9A-Za-z-.*?]/g, "")
            .replace(/\./g, "\\.")
            .replace(/\*+/g, "[0-9A-Za-z-]+")
            .replace(/\?/g, "[0-9A-Za-z-]") + "$", "i"))
        :
        null;
}

function rule2Pattern(rule) {
    return /^\/.+\/\w*$/.test(rule) ? string2RegExp(rule) : wildcard2RegExp(rule);
}

module.exports = {
    cache: cache,
    type: type,
    forEach: forEach,
    formatTime: formatTime,
    begin: begin,
    rule2Pattern: rule2Pattern
};