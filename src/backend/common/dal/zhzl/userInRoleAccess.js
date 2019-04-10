const baseAccess = require("@cig/restbase").baseAccessCompatible;
function tableAccess(operater,dal){
    baseAccess.apply(this,[operater,dal]);
}
tableAccess.prototype = unit.inherits({
    getColumns:function(){
        return {
            "roleId":"ROLEID",
            "userId":"USERID",
            "bz":"BZ",
            "lrr":"LRR",
            "dateCreated":"DATECREATED",
            "postEventId":"POSTEVENTID"
        };
    },
    getTable:function(){
        return "A4_SYS_USERINROLE";
    },

    /**
     * 关联A4_SYS_POSTINFO表查询岗位信息
     */
    getJoinRoleObjects:function(filter,order,callback){
        var columns = this.getJoinRoleColumns();
        var table = this.getJoinRoleTables();
        var where = this.buildWhere(filter,columns);
        var fields = this.buildSelectFields(columns);
        var orderStr = this.buildOrder(order,columns);
        this.innerGetObjects(table, fields, where, orderStr, callback);
    },
    getJoinRoleObject:function(filter,callback){
        var columns = this.getJoinRoleColumns();
        var table = this.getJoinRoleTables();
        var where = this.buildWhere(filter,columns);
        var fields = this.buildSelectFields(columns);
        this.innerGetObject(table,fields,where,callback);
    },
    getJoinRoleColumns:function(){
        return {
            "roleId":"UR.ROLEID",
            "userId":"UR.USERID",
            "roleName":"RI.R_NAME"
        };
    },
    getJoinRoleTables:function(){
        return " A4_SYS_USERINROLE UR LEFT JOIN A4_SYS_ROLEINFO RI ON UR.ROLEID = RI.ROLEID "
    }

},baseAccess.prototype);
module.exports = tableAccess;
