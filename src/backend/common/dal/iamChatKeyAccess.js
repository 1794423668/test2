const baseAccess = require("@cig/restbase").baseAccessCompatible;
var userSSDWBMGet = require(ROOT_DIR + "/common/unit/userSSDWBMGet");
function tableAccess(operater, dal) {
    baseAccess.apply(this, [operater, dal]);
}
tableAccess.prototype = unit.inherits({
    getColumns: function () {//的到user表字段
        return {
            //user表字段
            "USERID": "A4_SYS_USER.USERID",
            "USERNAME": "A4_SYS_USER.USERNAME",
            "PASSWORD": "A4_SYS_USER.PASSWORD",
            "LXDH": "A4_SYS_USER.LXDH",
            "DZYJ": "A4_SYS_USER.DZYJ",
            "BZ": "A4_SYS_USER.BZ",
            "SSDWBS": "A4_SYS_USER.SSDWBS",
            "LRR": "A4_SYS_USER.LRR",
            "RKRQ": "A4_SYS_USER.RKRQ",
            "ISADMIN": "A4_SYS_USER.ISADMIN",
            "ISSTATE": "A4_SYS_USER.ISSTATE",
            "SN": "A4_SYS_USER.SN",
            "SSZZBS": "A4_SYS_USER.SSZZBS",
            "RESOURCEPASSWORD": "A4_SYS_USER.RESOURCEPASSWORD",
            "ACCOUNTID": "A4_SYS_USER.ACCOUNTID",
            "USERPOSITION": "A4_SYS_USER.USERPOSITION",

        };
    },
    //关联表字段
    getJoinUserColumns: function () {
        return {
            "ActiveType": "CASE   WHEN  A4_SYS_USER.ISSTATE = 1 THEN '启用' WHEN A4_SYS_USER.ISSTATE = 0 THEN '禁用'  END ",
            "UserType": "CASE	WHEN A4_SYS_USER.ISADMIN = 0 THEN '普通用户' 	WHEN A4_SYS_USER.ISADMIN = 1 THEN  '管理员' WHEN A4_SYS_USER.ISADMIN = 2 THEN '禁超级管理员' END ",
            "UserId": "A4_SYS_USER.USERID",
            "UserId": "A4_SYS_USER.USERID",
            "UserName": "A4_SYS_USER.USERNAME",
            "Password": "A4_SYS_USER.PASSWORD",
            "Lxdh": "A4_SYS_USER.LXDH",
            "Dzyj": "A4_SYS_USER.DZYJ",
            "Bz": "A4_SYS_USER.BZ",
            "Ssdwbs": "A4_SYS_USER.SSDWBS",
            "Lrr": "A4_SYS_USER.LRR",
            "Rkrq": "A4_SYS_USER.RKRQ",
            "IsAdmin": "A4_SYS_USER.ISADMIN",
            "IsState": "A4_SYS_USER.ISSTATE",
            "sn": "A4_SYS_USER.SN",
            "Sszzbs": "A4_SYS_USER.SSZZBS",
            "RESOURCEPASSWORD": "A4_SYS_USER.RESOURCEPASSWORD",
            // "ACCOUNTID": "A4_SYS_USER.ACCOUNTID",
            "UserPosition": "A4_SYS_USER.USERPOSITION",
            //organization表 A4_SYS_ORGANIZATION
            // "OrganizationDisplayName": "ORG.DISPLAYNAME",
            // "ORGANIZATIONID": "ORG.DEPARTMENTID",
            //organization表 A4_SYS_DEPARTMENT
            "DepartmentDisplayName": "DEP.DISPLAYNAME",
            "DEPARTMENTID": "DEP.DEPARTMENTID",
            "STATE": "DEP.STATE"
        };
    },
    //政府级别表字段
    getJoinUserTwoLvColumns: function () {
        return {
            "ActiveType": "CASE   WHEN  UU.ISSTATE = 1 THEN '启用' WHEN UU.ISSTATE = 0 THEN '禁用'  END ",
            "UserType": "CASE	WHEN UU.ISADMIN = 0 THEN '普通用户' 	WHEN UU.ISADMIN = 1 THEN  '管理员' WHEN UU.ISADMIN = 2 THEN '禁超级管理员' END ",
            "UserId": "UU.USERID",
            "UserId": "UU.USERID",
            "UserName": "UU.USERNAME",
            "Password": "UU.PASSWORD",
            "Lxdh": "UU.LXDH",
            "Dzyj": "UU.DZYJ",
            "Bz": "UU.BZ",
            "Ssdwbs": "UU.SSDWBS",
            "Lrr": "UU.LRR",
            "Rkrq": "UU.RKRQ",
            "IsAdmin": "UU.ISADMIN",
            "IsState": "UU.ISSTATE",
            "sn": "UU.SN",
            "Sszzbs": "UU.SSZZBS",
            "RESOURCEPASSWORD": "UU.RESOURCEPASSWORD",
            // "ACCOUNTID": "A4_SYS_USER.ACCOUNTID",
            "UserPosition": "UU.USERPOSITION",
            //organization表 A4_SYS_ORGANIZATION
            // "OrganizationDisplayName": "ORG.DISPLAYNAME",
            // "ORGANIZATIONID": "ORG.DEPARTMENTID",
            //organization表 A4_SYS_DEPARTMENT
            "DepartmentDisplayName": "UU.DISPLAYNAME",
            "DEPARTMENTID": "UU.DEPARTMENTID"
        };
    },
    getJoinUserTable() {
        return `A4_SYS_USER
                left join A4_SYS_DEPARTMENT DEP on A4_SYS_USER.SSDWBS = DEP.DEPARTMENTID `
        //2018.7.26放弃组织
        // left join A4_SYS_DEPARTMENT ORG on A4_SYS_USER.Sszzbs = ORG.DEPARTMENTID`;
    },
    getTable: function () {//获取user表名称
        return "A4_SYS_USER";
    },
    getTwoLvTable: function () {
        //查询政府级别的最大位运算值求其子集
        var fmax = userSSDWBMGet.getUserMixValue(2 + "").toString();
        return `(SELECT A4_SYS_USER.*,dep.DEPARTMENTID,dep.DISPLAYNAME,
        CASE
          WHEN DEP.D_LEVEL = 1 THEN
           DEP.DEPARTMENTID
          ELSE
           BITAND(DEP.DEPARTMENTID,${fmax})
        END AS parentId  
       FROM A4_SYS_USER A4_SYS_USER
       INNER JOIN A4_SYS_DEPARTMENT DEP  ON DEP.DEPARTMENTID=A4_SYS_USER.SSDWBS AND DEP.STATE = 1) uu                    	   
       INNER JOIN A4_SYS_DEPARTMENT dep1 ON  dep1.departmentid=uu.parentId `;
    },

    /**
     * 查询网格树形语句
     */

    // 构建查询材料
    getServicesPage: function (filter, callback) {
        var columns = this.getJoinUserColumns();
        var table = this.getJoinUserTable();
        var where = this.buildWhere(filter, columns);
        var fields = this.buildSelectFields(columns);
        //调用baseAccess方法(cig应用)传参数得到数据.
        this.innerGetObject(table, fields, where, callback)
    },
    //查询普通级别的所有用户方法
    getUserListPage: function (offset, limit, filter, order, callback) {
        var columns = this.getJoinUserColumns();
        var table = this.getJoinUserTable();
        var where = this.buildWhere(filter, columns);
        var fields = this.buildSelectFields(columns);
        var orderStr = this.buildOrder(order);
        //调用baseAccess方法(cig应用)传参数得到数据.
        this.innerGetPage(offset, limit, table, fields, where, orderStr, callback)
    },
    //查询政府级别的所有用户方法
    getUserListTwo: function (offset, limit, filter, order, callback) {
        var columns = this.getJoinUserTwoLvColumns();
        var table = this.getTwoLvTable();
        var where = this.buildWhere(filter, columns);
        var fields = this.buildSelectFields(columns);
        var orderStr = this.buildOrder(order);
        //调用baseAccess方法(cig应用)传参数得到数据.
        this.innerGetPage(offset, limit, table, fields, where, orderStr, callback)
    },

    servicesInsert: function (obj, callback) {
        //var columns = this.getColumns();
        //var table = this.getTable();
        //var where = this.buildWhere(filter,columns);
        // var fields = this.buildSelectFields(columns);
        //调用baseAccess方法(cig应用)传参数得到数据.
        this.insert(obj, callback)
    },



}, baseAccess.prototype);
module.exports = tableAccess;

