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
    getLxdhColums: function () {
        return {
            "userId": "USERID",
            "phone": "LXDH"
        }
    },
    getTable: function () {
        return "A4_SYS_USER";
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
            "phone":"TA.LXDH",
            "dataDepartmentId":"to_char(TB.DATADEPARTMENTID)",
        };
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
    },
    getImObject:function(filter,callback){
        var columns = this.getImColumns();
        var table = this.getImTable();
        var where = this.buildWhere(filter,columns);
        var fields = this.buildSelectFields(columns);
        this.innerGetObject(table,fields,where,callback);
    },
    
},baseAccess.prototype);
module.exports = tableAccess;