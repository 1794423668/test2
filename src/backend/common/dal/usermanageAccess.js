const baseAccess = require("@cig/restbase").baseAccessCompatible;
function tableAccess(operater, dal) {
    baseAccess.apply(this, [operater, dal]);
}
tableAccess.prototype = unit.inherits({
    getColumns: function () {//的到CIG_SERVICE_APPLYDATA表字段
        return {

            "USERID": "USERID",
            "USERNAME": "USERNAME",
            "PASSWORD": "PASSWORD",
            "LXDH": "LXDH",
            "DZYJ": "DZYJ",
            "BZ": "BZ",
            "SSDWBS": "SSDWBS",
            "LRR": "LRR",
            "RKRQ": "RKRQ",
            "ISADMIN": "ISADMIN",
            "ISSTATE": "ISSTATE",
            "SN": "SN",
            // "SSZZBS": "SSZZBS",
            "RESOURCEPASSWORD": "RESOURCEPASSWORD",
            "ACCOUNTID": "ACCOUNTID",
            "USERPOSITION": "USERPOSITION",//用户职位

        };
    },
    getTable: function () {//获取user表名称
        return "A4_SYS_USER";
    },
    getHasBase4Column() {
        return false;
    },

    /**
     * 查询网格树形语句
     */

    // 构建查询材料
    getServicesPage: function (filter, order, offset, limit, callback) {
        var columns = this.getColumns();
        var table = this.getTable();
        var where = this.buildWhere(filter, columns);
        var fields = this.buildSelectFields(columns);
        var orderStr = this.buildOrder(order);
        //调用baseAccess方法(cig应用)传参数得到数据.
        this.getPage(filter, order, offset, limit, callback)
    },

    addUserInsert: function (obj, callback) {
        this.insert(obj, callback)
    },
}, baseAccess.prototype);
module.exports = tableAccess;

