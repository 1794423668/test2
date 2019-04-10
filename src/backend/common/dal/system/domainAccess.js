const baseAccess = require("@cig/restbase").baseAccessCompatible;
function tableAccess(operater,dal){
    baseAccess.apply(this,[operater,dal]);
}
tableAccess.prototype = unit.inherits({
    getHasBase4Column:function(){
        return false;
    },
    getColumns:function(){
        return {
            "id":"ID",
            "domainName":"DOMAINNAME",
            "key":"KEY",
            "value":"VALUE",
            "creator":"CREATOR",
            "createDate":"createDate",
            "updateDate":"updateDate",
        };
    },
    getTable:function(){
        return "DOMAINS";
    },
     getDoaminsWithDomainName: function (names, callback) {
        var self = this;
        this.getObjects({ domainName: names }, ["domainName", "key"], function (err, data) {
            if (err) callback(err, {});
            else {
                var res = {};
                names.forEach(function (name) {
                    res[name] = data.filter(function (item) {
                        return item.domainName == name;
                    }).map(function (item) {
                        return { text: item.value, value: item.key };
                    });
                }, this)
                callback(null, res);
            }
        })
    },
},baseAccess.prototype);
module.exports = tableAccess;