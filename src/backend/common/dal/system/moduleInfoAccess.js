//A4_SYS_MODULEINFO
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
            "moduleId":"MODULEID",
            "moduleName":"MODULENAME",
            "direction":"DIRECTION",
            "mLevel":"M_LEVEL",
            "teamName":"TEAMNAME",
            "tag":"TAG",
            "mOrder":"M_ORDER",
        };
    },
    getTable:function(){
        return "A4_SYS_MODULEINFO";
    }
},baseAccess.prototype);
module.exports = tableAccess;