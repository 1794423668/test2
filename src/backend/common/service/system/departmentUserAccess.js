const baseAccess = require("@cig/restbase").baseAccessCompatible;
function tableAccess(operater, dal) {
    baseAccess.apply(this, [operater, dal]);
}
tableAccess.prototype = unit.inherits({
    getHasBase4Column: function () {
        return false;
    },
    getColumns: function () {
        return {
            "departmentId":"to_char(SSDWBS)",
            "userId":"USERID",
            "userName":"USERNAME",
            "sszzbs":"to_char(SSZZBS)",
            "password":"PASSWORD",
            "phone":"LXDH",
            "email":"DZYJ",
            "isAdmin":"ISADMIN"
        };
    },
    getTable: function () {
        return "A4_SYS_USER";
    },
    getLxdhColums: function () {
        return {
            "userId": "USERID",
            "phone": "LXDH"
        }
    },
    getUserObjects:function(filter, order, callback) {
        var where = this.buildWhere(filter);
        var table = this.getTable();
        var fields = this.buildSelectFields(this.getLxdhColums());
        var orderStr = this.buildOrder(order);
        this.innerGetObjects(table, fields, where, orderStr, callback);
    },
    getImColumns:function(){
        return {
            "departmentId":"to_char(TA.SSDWBS)",
            "departmentName":"TB.DEPARTMENTNAME",
            "userId":"TA.USERID",
            "userName":"TA.USERNAME",
            "phone":"TA.LXDH"
        };
    },
    getTable:function(){
        return "A4_SYS_USER";
    },
    getImTable:function(){
        return "A4_SYS_USER TA LEFT JOIN A4_SYS_DEPARTMENT TB ON TA.SSDWBS=TB.DEPARTMENTID ";
    },

    getImObjects(filter, order, callback) {
        var where = this.buildWhere(filter);
        var table = this.getImTable();
        var fields = this.buildSelectFields(this.getImColumns());
        var orderStr = this.buildOrder(order);
        this.innerGetObjects(table, fields, where, orderStr, callback);
    }
}, baseAccess.prototype);
module.exports = tableAccess;