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
            "departmentId": "to_char(DEPARTMENTID)",
            "departmentName": "DEPARTMENTNAME",
            "level": "D_LEVEL",
            "category": "CATEGORY",
            "comments": "COMMENTS",
            "creator": "CREATOR",
            "auditLevell": "AUDITLEVELL",
            "departmentOrder": "DEPARTMENTORDER",
            "dataDepartmentId": "to_char(DATADEPARTMENTID)",
            "departmentXMin": "DEPARTMENTXMIN",
            "departmentXMax": "DEPARTMENTXMAX",
            "departmentYMin": "DEPARTMENTYMIN",
            "departmentYMax": "DEPARTMENTYMAX",
            "featureClassName": "FEATURECLASSNAME",
            "oldDepartmentId": "to_char(OLDDEPARTMENTID)",
            "displayName": "DISPLAYNAME",
            "departmentXCen": "DEPARTMENTXCEN",
            "departmentYCen": "DEPARTMENTYCEN",
            "departmentFullName": "DEPARTMENTFULLNAME",
            "mdmCode": "MDMCODE",
            "updateTime": "UPDATETIME",
        };
    },
    getTable: function () {
        return "A4_SYS_DEPARTMENT";
    },

    /**
     * 查询网格树形语句
     */
    getJoinDepartColumns: function () {
        return {
            "id": "to_char(DEP.DEPARTMENTID)",
            "level": "DEP.D_LEVEL",
            "text": "DEP.DEPARTMENTNAME",
            "fullname": "DEP.DEPARTMENTFULLNAME",
            "display": "DEP.DISPLAYNAME",
            "order": "DEP.DEPARTMENTORDER",
            "category": "DEP.CATEGORY",
            "parentId": "to_char(CASE WHEN DEP.D_LEVEL = 1 THEN DEP.DEPARTMENTID ELSE bitand ( DEP.DEPARTMENTID, ( SELECT L.MAXNUMBER FROM A4_SYS_DEPARTMENTLEVEL L WHERE L.LEVELID = DEP.D_LEVEL - 1 ) ) END) "
        }
    },

    getJoinDepartTable() {
        return "A4_SYS_DEPARTMENT DEP ";
    },

    getJoinDepartObjects: function (filter, order, callback) {
        var columns = this.getJoinDepartColumns();
        var table = this.getJoinDepartTable();
        var where = this.buildWhere(filter,columns);
        var fields = this.buildSelectFields(columns);
        var orderStr = this.buildOrder(order);
        this.innerGetObjects(table, fields, where, orderStr, callback);
    },
    getJoinStreetColumns: function () {
        return {
            "id": "to_char(a.DEPARTMENTID)",
            "level": "a.D_LEVEL",
            "text": "a.DEPARTMENTNAME",
            "fullname": "a.DEPARTMENTFULLNAME",
            "display": "a.DISPLAYNAME",
            "order": "a.DEPARTMENTORDER",
            "category": "a.CATEGORY",
            "streetId": "decode(b.D_LEVEL,'1',null,to_char(b.DEPARTMENTID))",
            "streetName": "decode(b.D_LEVEL,'1',null,to_char(b.DEPARTMENTNAME))",
        }
    },
    getJoinStreetTable() {
        return " A4_SYS_DEPARTMENT a INNER JOIN A4_SYS_DEPARTMENT b on bitand((select MAXNUMBER from A4_SYS_DEPARTMENTLEVEL where LEVELID = 2),a.DEPARTMENTID)=b.DEPARTMENTID ";
    },
    getJoinStreetObjects: function (filter, order, callback) {
        var columns = this.getJoinStreetColumns();
        var table = this.getJoinStreetTable();
        var where = this.buildWhere(filter,columns);
        var fields = this.buildSelectFields(columns);
        var orderStr = this.buildOrder(order);
        this.innerGetObjects(table, fields, where, orderStr, callback);
    }
}, baseAccess.prototype);
module.exports = tableAccess;
/**
 * CREATE TABLE "CIGPROXY"."A4_SYS_DEPARTMENT" 
   (	
    "DEPARTMENTID" NUMBER(20,0), 
	"DEPARTMENTNAME" NVARCHAR2(50), 
	"D_LEVEL" NUMBER(2,0), 
	"CATEGORY" NVARCHAR2(50), 
	"COMMENTS" NVARCHAR2(40), 
	"CREATOR" NVARCHAR2(40), 
	"AUDITLEVELL" NUMBER(1,0), 
	"DEPARTMENTORDER" NUMBER(12,0), 
	"DATADEPARTMENTID" NUMBER(20,0), 
	"DEPARTMENTXMIN" NUMBER(10,7), 
	"DEPARTMENTXMAX" NUMBER(10,7), 
	"DEPARTMENTYMIN" NUMBER(12,7), 
	"DEPARTMENTYMAX" NUMBER(12,7), 
	"FEATURECLASSNAME" NVARCHAR2(64), 
	"OLDDEPARTMENTID" NVARCHAR2(50), 
	"DISPLAYNAME" NVARCHAR2(2000), 
	"DEPARTMENTXCEN" NUMBER(12,7), 
	"DEPARTMENTYCEN" NUMBER(12,7), 
	"DEPARTMENTFULLNAME" NVARCHAR2(100), 
	"MDMCODE" NVARCHAR2(50), 
	"UPDATETIME" DATE
   ) SEGMENT CREATION IMMEDIATE 
  PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 524288 NEXT 524288 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT FLASH_CACHE DEFAULT CELL_FLASH_CACHE DEFAULT)
  TABLESPACE "CIGPROXY_DATA";


 */