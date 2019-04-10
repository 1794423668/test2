const baseAccess = require("@cig/restbase").baseAccessCompatible;
function tableAccess(operater,dal){
    baseAccess.apply(this,[operater,dal]);
}
tableAccess.prototype = unit.inherits({
    getColumns:function(){
        return {
            "postId":"POSTID",
            "userId":"USERID",
            "bz":"BZ",
            "lrr":"LRR",
            "dateCreated":"DATECREATED",
            "postEventId":"POSTEVENTID"
        };
    },
    getTable:function(){
        return "A4_SYS_USERINPOST"; 
    },

    /**
     * 关联A4_SYS_POSTINFO表查询岗位信息
     */
    getJoinPostObjects:function(filter,order,callback){
        var columns = this.getJoinPostColumns();
        var table = this.getJoinPostTables();
        var where = this.buildWhere(filter,columns);
        var fields = this.buildSelectFields(columns);
        var orderStr = this.buildOrder(order,columns);
        this.innerGetObjects(table, fields, where, orderStr, callback);
    },

    getJoinPostColumns:function(){
        return {
            "postId":"UP.POSTID",
            "userId":"UP.USERID",
            "post":"PI.P_NAME",
            "departmentId":"PI.DEPARTMENTID"
        };
    },
    getJoinPostTables:function(){
        return " A4_SYS_USERINPOST UP LEFT JOIN A4_SYS_POSTINFO PI ON UP.POSTID = PI.POSTID "
    }

},baseAccess.prototype);
module.exports = tableAccess;
