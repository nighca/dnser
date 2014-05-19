/*
 * Helpers --------------------------------------------------------
 */

// ajax方法
var maxRepeatNum = 3;
var doRequest = function(type, data, url, callback, repeat) {
    if(typeof data === 'string'){
        repeat = callback;
        callback = url;
        url = data;
        data = null;
    }
    $.ajax(url, {
        data: data,
        type: type,
        dataType: 'json',
        headers:{
            isAjax: true
        },
        success: function(res) {
            callback && callback(res.err, res.data);
        },
        error: function(err) {
            if (repeat === true) {
                repeat = maxRepeatNum;
            }
            if (typeof repeat === 'number' && repeat > 0) {
                doRequest(type, data, url, callback, --repeat);
            }else{
                callback && callback(err, null);
            }
        }
    });
};

var post = function(data, url, callback, repeat) {
    doRequest('post', data, url, callback, repeat);
};

var get = function(data, url, callback, repeat) {
    doRequest('get', data, url, callback, repeat);
};

// 渲染rule行
var renderRule = function(rule){
    return ([
        '<tr class="j-item">',
        '<td class="j-ruleIn" contenteditable="true">',
        rule.rule,
        '</td>',
        '<td class="j-addressIn" contenteditable="true">',
        rule.address,
        '</td>',
        '<td class="j-remove last">-</td>',
        '</tr>'
    ]).join('');
};

// 渲染rule列表
var renderRuleList = function(rules){
    return rules.map(renderRule).join('');
};

// 渲染client列表
var renderClientList = function(clients, curr){
    var clientsCnt = '';

    for(var id in clients){
        if(clients.hasOwnProperty(id)){
            clientsCnt += ([
                '<li class="client',
                id === curr ? ' curr' : '',
                '"><a href="?id=',
                id,
                '">',
                '<b>',
                clients[id].name,
                '</b>',
                '[',
                id,
                ']',
                '[',
                clients[id].ip,
                ']',
                '</a>',
                '</li>'
            ]).join('');
        }
    }

    return clientsCnt;
};

/*
 * Main --------------------------------------------------------
 */

// 带延迟保存
var timer;
var waitAndSave = function(list, id, saved, delay){
    if(delay === undefined){
        delay = 2000;
    }

    if(timer){
        clearTimeout(timer);
    }

    timer = setTimeout(function(){
        post({
            list: JSON.stringify(list),
            id: id
        }, '/list', saved);
    }, delay);
};

$(function(){
    var validIpdPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

    var args = {};
    location.search.slice(1).split('&').filter(function(eq){return eq;}).forEach(function(eq){
        var eqPos = eq.indexOf('=');
        if(eqPos > 0){
            args[eq.slice(0, eqPos)] = eq.slice(eqPos + 1);
        }
    });

    var doms = {
        rules: $('#rules'),
        clients: $('#clients'),
        refreshClients: $('#refresh-clients'),
        items: [],
        notice: $('#notice'),
        header: $('#rule-header')
    };

    var list = [];

    // 消息通知
    var timer;
    var notice = function(msg){
        clearTimeout(timer);
        doms.notice.text(msg);
        timer = setTimeout(function(){
            doms.notice.text('');
        }, 4000);
    };

    // 读取、保存当前输入
    var trySave = function(delay){
        notice('');
        var curr = doms.items.map(function(item){
            return {
                address: item.addressIn.html(),
                rule: item.ruleIn.html()
            };
        }).filter(function(item){
            return item.address || item.rule;
        });

        var invalid = curr.filter(function(item){
            return !validIpdPattern.test(item.address);
        });

        if(invalid.length){
            notice('IP格式错误！');
            return;
        }

        waitAndSave(curr, args.id, function(err, l){
            if(err){
                notice('保存失败，' + JSON.stringify(err));
            }else{
                notice('已保存');
                updateRulesDom(renderRuleList(list = l));
            }
        }, delay);
    };

    // 编辑区交互

    var onEdit = function(e){
        trySave(2000);
    };

    var onBlur = function(e){
        trySave(1000);
    };

    var onFocus = function(e){
        //notice('');
        if(timer){
            clearTimeout(timer);
        }
    };

    var onKeyDown = function(e){
        if(e.which == 13){
            e.preventDefault();
            trySave(0);
        }
    };

    var updateRulesDom = function(cnt){
        // 渲染html
        doms.rules.html(cnt);

        // 获取items
        doms.items = Array.prototype.map.call($('.j-item'), function(item){
            item = $(item);
            return {
                wrapper: item,
                ruleIn: item.find('.j-ruleIn'),
                addressIn: item.find('.j-addressIn'),
                remove: item.find('.j-remove')
            };
        });

        // 绑定事件
        doms.items.forEach(function(item, i){
            item.ruleIn.on('keyup', onEdit);
            item.addressIn.on('keyup', onEdit);
            item.ruleIn.on('blur', onBlur);
            item.addressIn.on('blur', onBlur);
            item.ruleIn.on('blur', onFocus);
            item.addressIn.on('blur', onFocus);
            item.ruleIn.on('keydown', onKeyDown);
            item.addressIn.on('keydown', onKeyDown);
            item.remove.on('click', function(e){
                item.ruleIn.html('');
                item.addressIn.html('');
                trySave(0);
            });
        });
    };

    // 获取rule列表
    get({
        id: args.id
    }, '/list', function(err, l){
        var cnt = err ?
            ('获取rule列表出错: <br/>' + JSON.stringify(err)) :
            renderRuleList(list = l);

        updateRulesDom(cnt);
    });

    var updateClientsDom = function(cnt){
        doms.clients.html(cnt);
    };

    // 获取client列表
    get('/clients', function(err, clients){
        var cnt = err ?
            ('获取client列表出错: <br/>' + JSON.stringify(err)) :
            renderClientList(clients, args.id);

        updateClientsDom(cnt);
    });

    // 绑定刷新客户端列表
    doms.refreshClients.on('click', function(e){
        updateClientsDom('...');
        get('/refresh-clients', function(err, clients){
            var cnt = err ?
                ('刷新client列表出错: <br/>' + JSON.stringify(err)) :
                renderClientList(clients, args.id);

            updateClientsDom(cnt);
        });
    });

    // 绑定添加新行事件
    doms.header.on('click', function(e){
        var cnt = renderRuleList(list.concat({
            rule: 'static.iqiyi.com',
            address: '10.1.xxx.xx'
        }));

        updateRulesDom(cnt);
    });

});