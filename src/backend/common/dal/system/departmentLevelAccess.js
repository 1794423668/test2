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
            "levelId":"LEVELID",
            "digit":"DIGIT",
            "maxNumber":"to_char(MAXNUMBER)",
            "minNumber":"to_char(MINNUMBER)",
        };
    },
    getTable:function(){
        return "A4_SYS_DEPARTMENTLEVEL";
    }
},baseAccess.prototype);
module.exports = tableAccess;

/**
CREATE TABLE "CIGPROXY"."A4_SYS_DEPARTMENTLEVEL" 
   (	
    "LEVELID" NUMBER(2,0), 
	"DIGIT" NUMBER(2,0), 
	"MAXNUMBER" NUMBER(20,0), 
	"MINNUMBER" NUMBER(20,0)
   ) SEGMENT CREATION IMMEDIATE 
  PCTFREE 10 PCTUSED 40 INITRANS 1 MAXTRANS 255 NOCOMPRESS LOGGING
  STORAGE(INITIAL 524288 NEXT 524288 MINEXTENTS 1 MAXEXTENTS 2147483645
  PCTINCREASE 0 FREELISTS 1 FREELIST GROUPS 1 BUFFER_POOL DEFAULT FLASH_CACHE DEFAULT CELL_FLASH_CACHE DEFAULT)
  TABLESPACE "CIGPROXY_DATA";

 */