var dataAccess = require("@cig/restbase").dataAccess;
var userSSDWBMGet = require(ROOT_DIR + "/common/unit/userSSDWBMGet");
var departmentAccess = require(ROOT_DIR + "/common/dal/system/departmentAccess");
var departmentLevelAccess = require(ROOT_DIR + "/common/dal/system/departmentLevelAccess");
const { cache, async} = require("@cig/restbase").tools;
var categoryArea = '行政区划';
var services = {
    _getAllLevelFromDb: function (callback) {
        var dal = new departmentLevelAccess();
        async.series([
            dal.open.bind(dal, false),
            dal.getObjects.bind(dal, {}, { "levelId": true })
        ], function (err, data) {
            dal.close(function () { });
            callback(err, data && data[1]);
        });
    },
    /**
     * @description 获取所有层级的配置信息
     * @param {AsynCallback} callback
     */
    getAllLevel: function (callback) {
        return cache.cacheTask("dep_all_level", 3600, services._getAllLevelFromDb.bind(services), callback)
    },
    /**
     * @description 获取指定层级的配置信息
     * @param {String} level
     * @param {AsynCallback} callback
     */
    getLevel: function (level, callback) {
        services.getAllLevel(function (err, res) {
            if (err) callback(err);
            else {
                callback(null, res.filter(function (item) {
                    return item.levelId == level;
                })[0]);
            }
        })
    },
    /**
     * @description 获取用户单位的数据权限下的单位
     * @param {String} userDepId 用户单位
     * @param {String} parentId  想要获取下级单位的
     * @param {AsynCallback} callback
     */
    getUserDataDepartByParent: function (userDepId, parentId, callback, HaveGateGory) {
        var dal = new departmentAccess();
        async.autoInject({
            "open": dal.open.bind(dal, false),
            "userDep": function (open, callback) {
                if (userDepId) {
                    dal.getObject({ departmentId: `${userDepId}` }, callback);
                }
                else {
                    dal.getObject({ level: 1 }, callback);
                }
            },
            "userDataDep": function (userDep, callback) {
                if (!userDep) callback(new Error("没有找到用户单位"));
                else {
                    dal.getObject({ departmentId: `${userDep.dataDepartmentId}` }, function (err, dep) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            callback(null, dep ? dep : userDep);
                        }
                    });
                }
            },
            "parentDep": function (open, callback) {
                if (parentId) {
                    dal.getObject({ departmentId: `${parentId}` }, callback);
                }
                else {
                    callback(null, null);
                }
            },
            "parentDepFilter": function (parentDep, callback) {
                if (parentDep) {
                    services.getDepFilter(parentDep, "DEPARTMENTID", callback);
                }
                else {
                    callback(null, null);
                }
            },
            "depFilter": function (userDataDep, callback) {
                services.getDepFilter(userDataDep, "DEPARTMENTID", callback);
            },
            "children": function (userDataDep, depFilter, parentDep, parentDepFilter, callback) {
                //对参数进行判断看是否加限制条件
                if (HaveGateGory == "0") {
                    var filter = {
                        "ssdw": depFilter,
                        "category": categoryArea,
                        "level": (parentDep ? parseInt(parentDep.level) : parseInt(userDataDep.level)) + 1
                    }
                } else if (HaveGateGory == "1") {
                    var filter = {
                        "ssdw": depFilter,
                        "level": (parentDep ? parseInt(parentDep.level) : parseInt(userDataDep.level)) + 1
                    }
                }

                if (parentDepFilter) {
                    filter["parentSsdw"] = parentDepFilter;
                }
                dal.getObjects(filter, { departmentOrder: true }, callback);
            }
        }, function (err, res) {
            dal.close(function () { });
            if (err) callback(err);
            else {
                callback(null, res.children.map(function (item) {
                    return {
                        "id": item.departmentId,
                        "name": item.departmentName,
                    }
                }));
            }
        });
    },
    /**
     * @description 获取指定单位的过滤条件
     * @param {Object} depart
     * @param {String} tableDepColumn 表中dep的列
     * @param {AsynCallback} callback
     */
    getDepFilter: function (depart, tableDepColumn, callback) {
        services.getLevel(depart.level, function (err, level) {
            if (err) callback(err);
            else {
                var depMax = level.maxNumber;
                var depMin = level.minNumber;
                var filter = {
                    type: `bitand (:depMax,${tableDepColumn})= (:depParentId)`,
                    vals: {
                        depMax: `${depMax}`,
                        depParentId: `${depart.departmentId}`,
                    }
                };
                callback(null, filter);
            }
        });
    },
    /**
     * @description 获取指定单位的过滤条件
     * @param {String} departId 单位ID
     * @param {String} tableDepColumn 表中dep的列
     * @param {AsynCallback} callback
     */
    getDepFilterById:function(departId,tableDepColumn,callback){
        services.getDepartById(departId,function(err,depart){
            if(err)callback(err);
            else{
                services.getDepFilter(depart,tableDepColumn,callback);
            }
        })
    },
    /**
     * @description 获取指定单位的所有父级单位
     * @param {String} departId 单位ID
     * @param {AsynCallback} callback
     */
    getDepartParents:function(departId,callback){
        services.getDepartById(departId,function(err,depart){
            if(err)callback(err);
            else{
                if(depart.level == 1){
                    callback(err,[]);
                }
                else{
                    services.getAllLevel(function(err,levels){
                        if(err)callback(err);
                        else{
                            var filters = {};
                            var tableDepColumn = 'DEPARTMENTID';
                            levels.forEach(function(level,index){
                                var depMax = level.maxNumber;
                                var depMin = level.minNumber;
                                if(level.levelId < depart.level){
                                    var vals = {};
                                    vals[`depMax${index}`] = `${depMax}`;
                                    vals[`depId${index}`] = `${depart.departmentId}`;
                                    var filter = {
                                        type:`bitand (:depMax${index},:depId${index})= (${tableDepColumn})`,
                                        vals:vals
                                    };
                                    filters[`depFilter${index}`] = filter
                                }
                            });
                            var departmentAcc = new departmentAccess();
                            async.series([
                                departmentAcc.open.bind(departmentAcc,false),
                                departmentAcc.getObjects.bind(departmentAcc,{"or":filters},{level:true})
                            ],function(err,data){
                                departmentAcc.close(function(){});
                                var parents = [];
                                if(data[1]){
                                    data[1].forEach(function(element) {
                                        parents.push(element)
                                    }, this);
                                }
                                callback(err,parents)
                            })
                        }
                    });
                }
            }
        })
    },
    /**
     * @description 获取单位过滤的filter
     * @param {id} id 单位ID
     * @param {key} key 待筛选列的key
     * @param {filter} filter 原有查询条件
     * @param {AsynCallback} callback 含单位过滤的查询条件 
     */
    addDeptFilter: function (dal, id, key, filter, callback) {
        dal.getObject({ departmentId: id + "" }, function (err, data) {
            if (data) {
                services.getLevel(data.level, function (err, level) {
                    if (err) callback(err);
                    else {
                        var depMax = level.maxNumber;
                        var depMin = level.minNumber;
                        filter[key] = { type: "bitand", vals: [depMax + "", id + ""] };
                        callback(null, filter);
                    }
                });
            }
            else {
                callback(null, filter);
            }
        })
    },
    /**
     * @description 查询村/社区级别的单位
     */
    queryVillages:function(departId,callback){
        services.getDepFilterById(departId,"DEPARTMENTID",function(err,depFilter){
            if(err)callback(err);
            else{
                var filter = {level:3,ssdwdm:depFilter,category:categoryArea};
                var departmentAcc = new departmentAccess();
                async.series([
                    departmentAcc.open.bind(departmentAcc,false),
                    departmentAcc.getObjects.bind(departmentAcc,filter,{level:true})
                ],function(err,data){
                    departmentAcc.close(function(){});
                    callback(err,data&&data[1])
                })
            }
        })
    },
    /**
     * @description 添加房屋时，可选择本村的所有网格，
     * @param {user} user 网格员信息
     */
    queryVillageGrid: function (user, callback) {
        var dal = new dataAccess();
        var departmentAcc = new departmentAccess(user, dal);
        async.autoInject({
            "open": dal.open.bind(dal, true),
            "getDepartParam": function (open, callback) {
                departmentAcc.getObject({ departmentid: user.userDepartmentId + "" }, function (err, data) {
                    callback(err, data);
                });
            },
            "getGrid": function (getDepartParam, callback) {
                if (getDepartParam) {
                    if (getDepartParam.level == 4) {
                        var fmax = userSSDWBMGet.getUserMixValue("3");
                        var param = { fmax: fmax, zId: user.userDepartmentId + "" }
                        var sql = `select departmentid as "id",departmentname as "name" from A4_SYS_DEPARTMENT WHERE BITAND(:fmax,departmentId)= BITAND(:fmax,:zId) and d_level =4 `;
                        var options = { maxRows: 500 };
                        dal.queryObjects(sql, param, options, function (err, data) {
                            if (err) {
                                callback(err);
                            } else {
                                for (var i = 0; i < data.length; i++) {
                                    if (data[i]["id"] == user.userDepartmentId) {
                                        data[i]["isSameGrid"] = "1";
                                    } else {
                                        data[i]["isSameGrid"] = "0";
                                    }
                                }
                            }
                            callback(err, data);
                        })
                    } else {
                        callback("当前操作人员不是网格员");
                    }
                } else {
                    callback("未找到用户所属网格");
                }
            }
        }, function (err, data) {
            dal.close(function () { });
            if (err) {
                callback(err);
            } else {
                callback(err, data && data["getGrid"]);
            }
        });
    },
    getDepartById: function (depId, callback) {
        var departmentAcc = new departmentAccess();
        async.series([
            departmentAcc.open.bind(departmentAcc, false),
            departmentAcc.getObject.bind(departmentAcc, { departmentId: `${depId}` }),
            departmentAcc.close.bind(departmentAcc)
        ], function (err, res) {
            callback(err, res && res[1]);
        });
    },
    /**
     * 获取网格树形
     * @param departmentId  网格id 为空时默认查询所有
     * @param allGrid     1 ：打开 （查询所有）0：关闭 （查询departmentId下的所有）
     * @param category
     */
    getGridTreeByFilter: function (departmentId, allGrid, category, callback) {
        var departmentAcc = new departmentAccess();
        departmentAcc.setRowLimit(false);
        var order = [
            { "DEP.D_LEVEL": true },
            { "DEP.DEPARTMENTORDER": true }
        ];
        var filter = {};
        if (category && category != "")
            filter.category = category;
        async.autoInject({
            "open": departmentAcc.open.bind(departmentAcc, false),
            "getGrid": function (open, callback) {
                if (departmentId && allGrid == "0") {
                    //获取部门的等级   
                    departmentAcc.getObject({ departmentId: departmentId + "" }, function (err, data) {
                        if (err) {
                            callback(err);
                        } else {
                            if (data) {
                                var fmax = userSSDWBMGet.getUserMixValue(data.level + "") + "";
                                filter = Object.assign(filter, {
                                    "id": { type: "bitand", vals: [fmax, departmentId + ""] }
                                })
                            }
                            callback(null, filter);
                        }
                    });
                } else {
                    callback(null, filter);
                }
            },
            "getGrids": function (getGrid, callback) {
                departmentAcc.getJoinDepartObjects(filter, order, function (err, datas) {
                    if (err) {
                        callback(err);
                    } else {
                        //数据整合
                        var parent;
                        if (datas && datas.length > 0)
                            parent = datas[0];
                        var result = getNodes(datas, parent);
                        if (result && result.length > 0) {
                            parent.nodes = result;
                        }
                        callback(null, parent);
                    }
                });
            }
        }, function (err, data) {
            departmentAcc.close(function () { });
            callback(err, data.getGrids);
        });
    },
    /**
     * @description 获取用户单位的数据权限下的单位
     * @param {String} userDepId 用户单位
     * @param {String} parentId  想要获取下级单位的
     * @param {AsynCallback} callback
     */
    getUserAllDataDepartByParent:function(userDepId,parentId,callback){
        var dal = new departmentAccess();
        async.autoInject({
            "open":dal.open.bind(dal,false),
            "userDep":function(open,callback){
                if(userDepId){
                    dal.getObject({departmentId:`${userDepId}`},callback);
                }
                else{
                    dal.getObject({level:1},callback);
                }
            },
            "userDataDep":function(userDep,callback){
                if(!userDep)callback(new Error("没有找到用户单位"));
                else{
                    dal.getObject({departmentId:`${userDep.dataDepartmentId}`},function(err,dep){
                        if(err){
                            callback(err);
                        }
                        else{
                            callback(null,dep?dep:userDep);
                        }
                    });
                }
            },
            "parentDep":function(open,callback){
                if(parentId){
                    dal.getObject({departmentId:`${parentId}`},callback);
                }
                else{
                    callback(null,null);
                }
            },
            "parentDepFilter":function(parentDep,callback){
                if(parentDep){
                    services.getDepFilter(parentDep,"DEPARTMENTID",callback);
                }
                else{
                    callback(null,null);
                }
            },
            "depFilter":function(userDataDep,callback){
                services.getDepFilter(userDataDep,"DEPARTMENTID",callback);
            },
            "children":function(userDataDep,depFilter,parentDep,parentDepFilter,callback){
                var filter = {
                    "ssdw":depFilter,
                    "level":(parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1
                };
                if(parentDepFilter){
                    filter["parentSsdw"] = parentDepFilter;
                }
                dal.getObjects(filter,{departmentOrder:true},callback);
            }
        },function(err,res){
            dal.close(function(){});
            if(err)callback(err);
            else{
                callback(null,res.children.map(function(item){
                    return {
                        "id":item.departmentId,
                        "name":item.departmentName,
                    }
                }));
            }
        });
    },
    getAllDeptTree:function(depId,callback){
        var dal = new dataAccess();
        var departmentAcc = new departmentAccess(null,dal);
        async.autoInject({
            "open": dal.open.bind(dal, true),
            "getLevel":function (open,callback) {
                departmentAcc.getObject({departmentid:depId+""},function(err,data){
                    callback(err,data);
                });
            },
            "getLower":function (getLevel,callback) {
                if(getLevel){
                    var level=getLevel.level;
                    var max = userSSDWBMGet.getUserMixValue(level+"");
                    var sql=`  SELECT a.DEPARTMENTNAME AS "text",a.DEPARTMENTID AS "id",a.D_LEVEL AS "level",bitand(b.MAXNUMBER,a.DEPARTMENTID) as "pId" FROM	A4_SYS_DEPARTMENT a INNER JOIN A4_SYS_DEPARTMENTLEVEL b on (to_number(a.D_LEVEL)-1) = to_number(b.LEVELID) WHERE BITAND('${max}',DEPARTMENTID) = '${depId}' ORDER BY a.D_LEVEL,a.departmentorder `;
                    var options = {maxRows :2000};
                    dal.queryObjects(sql,{},options,function(err,data){
                        if(err){
                            callback(err);
                        }else{
                            var result = services.newGetTree(data,depId,"id","pId","nodes");
                            callback(err,result);
                        }
                    });
                }else{
                    callback("找不到对应部门");
                }
            },
            "getDept":function (getLevel,getLower,callback) {
                if(getLevel){
                    var level=getLevel.level;
                    var sql = ``;
                    for(var i=1;i<=level;i++){
                        if(i!=1){ sql += ` union `;}
                        var max = userSSDWBMGet.getUserMixValue(i+"");
                        sql+=` SELECT DEPARTMENTNAME,DEPARTMENTID,D_LEVEL from A4_SYS_DEPARTMENT WHERE "BITAND"('${max}','${depId}') = DEPARTMENTID `;
                    }
                    sql+=` ORDER BY D_LEVEL  `;
                    var options = {maxRows :500};
                    dal.queryObjects(sql,{},options,function(err,data){
                        if(err){
                            callback(err);
                        }else{
                            var result = {};
                            var tmp = {};
                            for(var i=data.length-1;i>=0;i--){
                                tmp["selectable"]=false;
                                //tmp["state"] = {expanded:true};
                                tmp["text"] = data[i]["DEPARTMENTNAME"];
                                tmp["id"] = data[i]["DEPARTMENTID"];
                                tmp["level"]=data[i]["D_LEVEL"]-level;
                                if(i!=data.length-1){ 
                                    tmp["nodes"]=[result]; 
                                }else{
                                    tmp["selectable"]=true;
                                    tmp["state"] = {expanded:true,selected:true};
                                    tmp["nodes"]=getLower;
                                }
                                result = tmp;
                                tmp = {};
                            }
                            callback(null,result);
                        }
                    });
                }else{
                    callback("找不到对应部门");
                }
            },
        },function(err,data){
            dal.close(function(){});
            if(err){
                callback(err);
            }else{
                if(data&&data["getDept"]){
                    var result = [];
                    result.push(data["getDept"]);
                    callback(err,result);
                }else{
                    callback("找不到对应部门");
                }
            }
        });
    },
    newGetTree: function(data, id, idTxt, pIdTxt, pushTxt) {
        var idTxt = idTxt || 'id';
        var pIdTxt = pIdTxt || 'pId';
        var pushTxt = pushTxt || 'children';
        function getNode(tag,id) {
            var node = [];
            var level = null;
            for (var i = tag; i < data.length; i++) {
                if(id == data[i][pIdTxt]){
                    var children = getNode(i+1,data[i][idTxt]);
                    if (children) {
                        data[i][pushTxt] = children;
                    }
                    node.push(data[i]);
                    if(!level){
                        level = data[i]["level"];
                    }
                }else{
                    if(level&&level<data[i]["level"]){
                        break;
                    }
                }
            }
            if (node.length == 0) {
                return
            } else {
                return node
            }
        }
        var result = getNode(0,id);
        return result;
    },
    getTree: function(data, id, level, idTxt, levelTxt, pushTxt) {
        var idTxt = idTxt || 'id';
        var levelTxt = levelTxt || 'level';
        var pushTxt = pushTxt || 'children';
        function bitcheck(max,zid,id){
            var max1 = max.toString('2').split('');
            var zid1 = zid.toString('2').split('');
            var id1 = id.toString('2').split('');
            var min = zid1.length<max1.length?zid1.length:max1.length;
            if(min==id1.length){
                for(var i=0;i<min;i++){
                    if((max1[i]&zid1[i]+'')!=id1[i]){
                        break;
                    }
                }
                if(i!=min){
                    return false;
                }else{
                    return true;
                }
            }else{
                return false;
            }
        }
        function getNode(tag, id, level) {
            var node = []
            var max = userSSDWBMGet.getUserMixValue(level+"");
            for (var i = tag; i < data.length; i++) {
                if(level == data[i][levelTxt]){
                    continue;
                }else if(level + 1 == data[i][levelTxt]){
                    if(bitcheck(max,data[i][idTxt],id)){
                        if(data[i][levelTxt]!=data[data.length-1][levelTxt]){
                            var children = getNode(i,data[i][idTxt], data[i][levelTxt]);
                            if (children) {
                                data[i][pushTxt] = children;
                            }
                        }
                        node.push(data[i])
                    }
                }else{
                    break;
                }
            }
            if (node.length == 0) {
                return
            } else {
                return node
            }
        }
        var result = getNode(0, id, level);
        return result;
    },
    getAllGridTree:function(depId,callback){
        var dal = new dataAccess();
        var departmentAcc = new departmentAccess(null,dal);
        async.autoInject({
            "open": dal.open.bind(dal, true),
            "getLevel":function (open,callback) {
                departmentAcc.getObject({departmentid:depId+""},function(err,data){
                    callback(err,data);
                });
            },
            "getLower":function (getLevel,callback) {
                if(getLevel){
                    var level=getLevel.level;
                    var max = userSSDWBMGet.getUserMixValue(level+"");
                    var sql=`  SELECT DEPARTMENTNAME as "name",DEPARTMENTID as "id",D_LEVEL as "level",bitand(b.MAXNUMBER,a.DEPARTMENTID) as "pId" from A4_SYS_DEPARTMENT  a INNER JOIN A4_SYS_DEPARTMENTLEVEL b on (to_number(a.D_LEVEL)-1) = to_number(b.LEVELID) WHERE BITAND('${max}',a.DEPARTMENTID) = '${depId}' AND CATEGORY = '行政区划' ORDER BY a.D_LEVEL,a.departmentorder `;
                    var options = {maxRows :2000};
                    dal.queryObjects(sql,{},options,function(err,data){
                        if(err){
                            callback(err);
                        }else{
                            var result = services.newGetTree(data,depId,"id","pId");
                            callback(err,result);
                        }
                    });
                }else{
                    callback("找不到对应部门");
                }
            },
            "getDept":function (getLevel,getLower,callback) {
                if(getLevel){
                    var level=getLevel.level;
                    var sql = ``;
                    for(var i=1;i<=level;i++){
                        if(i!=1){ sql += ` union `;}
                        var max = userSSDWBMGet.getUserMixValue(i+"");
                        sql+=` SELECT DEPARTMENTNAME,DEPARTMENTID,D_LEVEL from A4_SYS_DEPARTMENT WHERE "BITAND"('${max}','${depId}') = DEPARTMENTID  AND CATEGORY = '行政区划'`;
                    }
                    sql+=` ORDER BY D_LEVEL  `;
                    var options = {maxRows :500};
                    dal.queryObjects(sql,{},options,function(err,data){
                        if(err){
                            callback(err);
                        }else{
                            var result = {};
                            var tmp = {};
                            for(var i=data.length-1;i>=0;i--){
                                if (data[i]["D_LEVEL"] < 1) {
                                    continue;
                                }
                                tmp["name"] = data[i]["DEPARTMENTNAME"];
                                tmp["id"] = data[i]["DEPARTMENTID"];
                                tmp["level"]=data[i]["D_LEVEL"];
                                if(i!=data.length-1){ 
                                    tmp["children"]=[result]; 
                                }else{
                                    tmp["children"]=getLower;
                                }
                                result = tmp;
                                tmp = {};
                            }
                            callback(null,result);
                        }
                    });
                }else{
                    callback("找不到对应部门");
                }
            },
        },function(err,data){
            dal.close(function(){});
            if(err){
                callback(err);
            }else{
                if(data&&data["getDept"]){
                    var result = {};
                    result=data["getDept"].children;
                    callback(err,result);
                }else{
                    callback("找不到对应部门");
                }
            }
        });
    },

    // getAllGridTree:function(depId,callback){
    //     var dal = new dataAccess();
    //     var departmentAcc = new departmentAccess(null,dal);
    //     async.autoInject({
    //         "open": dal.open.bind(dal, true),
    //         "getLevel":function (open,callback) {
    //             departmentAcc.getObject({departmentid:depId+""},function(err,data){
    //                 callback(err,data);
    //             });
    //         },
    //         "getLower":function (getLevel,callback) {
    //             if(getLevel){
    //                 var level=getLevel.level;
    //                 var max = userSSDWBMGet.getUserMixValue(level+"");
    //                 var sql=`  SELECT DEPARTMENTNAME as "name",DEPARTMENTID as "id",D_LEVEL as "level" from A4_SYS_DEPARTMENT WHERE BITAND('${max}',DEPARTMENTID) = '${depId}' AND CATEGORY = '行政区划' ORDER BY D_LEVEL `;
    //                 var options = {maxRows :2000};
    //                 dal.queryObjects(sql,{},options,function(err,data){
    //                     if(err){
    //                         callback(err);
    //                     }else{
    //                         var result = services.getTree(data,parseInt(depId),level,"id","level");
    //                         callback(err,result);
    //                     }
    //                 });
    //             }else{
    //                 callback("找不到对应部门");
    //             }
    //         },
    //         "getDept":function (getLevel,getLower,callback) {
    //             if(getLevel){
    //                 var level=getLevel.level;
    //                 var sql = ``;
    //                 for(var i=1;i<=level;i++){
    //                     if(i!=1){ sql += ` union `;}
    //                     var max = userSSDWBMGet.getUserMixValue(i+"");
    //                     sql+=` SELECT DEPARTMENTNAME,DEPARTMENTID,D_LEVEL from A4_SYS_DEPARTMENT WHERE "BITAND"('${max}','${depId}') = DEPARTMENTID  AND CATEGORY = '行政区划'`;
    //                 }
    //                 sql+=` ORDER BY D_LEVEL  `;
    //                 var options = {maxRows :500};
    //                 dal.queryObjects(sql,{},options,function(err,data){
    //                     if(err){
    //                         callback(err);
    //                     }else{
    //                         var result = {};
    //                         var tmp = {};
    //                         for(var i=data.length-1;i>=0;i--){
    //                             if (data[i]["D_LEVEL"] < 2) {
    //                                 continue;
    //                             }
    //                             tmp["name"] = data[i]["DEPARTMENTNAME"];
    //                             tmp["id"] = data[i]["DEPARTMENTID"];
    //                             tmp["level"]=data[i]["D_LEVEL"];
    //                             if(i!=data.length-1){ 
    //                                 tmp["children"]=[result]; 
    //                             }else{
    //                                 tmp["children"]=getLower;
    //                             }
    //                             result = tmp;
    //                             tmp = {};
    //                         }
    //                         callback(null,result);
    //                     }
    //                 });
    //             }else{
    //                 callback("找不到对应部门");
    //             }
    //         },
    //     },function(err,data){
    //         dal.close(function(){});
    //         if(err){
    //             callback(err);
    //         }else{
    //             if(data&&data["getDept"]){
    //                 var result = [];
    //                 result.push(data["getDept"]);
    //                 callback(err,result);
    //             }else{
    //                 callback("找不到对应部门");
    //             }
    //         }
    //     });
    // },
    /**
     * 获取行政区划树，参数obj
     * {
     *   deptId：查询部门id，获取该id下的树，不能为空
     *   withParent: 是否包含上级部门,（比如若查询雉城街道时，是否包含长兴节点），默认为false,
     *   limitLevel: 限制查到的最小行政区划级别，比如控制不查网格级
     * }
     */
    getAllGridTreeWithObj:function(obj,callback){
        var dal = new dataAccess();
        var departmentAcc = new departmentAccess(null,dal);
        var withParent = false;
        if(obj.withParent){
            withParent = obj.withParent;
        }
        async.autoInject({
            "open": dal.open.bind(dal, true),
            "getLevel":function (open,callback) {
                departmentAcc.getObject({departmentid:obj.deptId+""},function(err,data){
                    callback(err,data);
                });
            },
            "getLower":function (getLevel,callback) {
                if(getLevel){
                    var level=getLevel.level;
                    var max = userSSDWBMGet.getUserMixValue(level+"");
                    var sql=`  SELECT DEPARTMENTNAME as "name",DEPARTMENTID as "id",D_LEVEL as "level",bitand(b.MAXNUMBER,a.DEPARTMENTID) as "pId" from A4_SYS_DEPARTMENT  a INNER JOIN A4_SYS_DEPARTMENTLEVEL b on (to_number(a.D_LEVEL)-1) = to_number(b.LEVELID) WHERE BITAND('${max}',a.DEPARTMENTID) = '${obj.deptId}' AND CATEGORY = '行政区划'`
                    if(obj.limitLevel){
                        sql+=` and a.d_level <= ${obj.limitLevel} `;
                    }
                    sql+=` ORDER BY a.D_LEVEL,a.departmentorder `;
                    var options = {maxRows :2000};
                    dal.queryObjects(sql,{},options,function(err,data){
                        if(err){
                            callback(err);
                        }else{
                            var result = services.newGetTree(data,obj.deptId,"id","pId");
                            callback(err,result);
                        }
                    });
                }else{
                    callback("找不到对应部门");
                }
            },
            "getDept":function (getLevel,getLower,callback) {
                if(getLevel){
                    var level=getLevel.level;
                    var sql = ``;
                    var i=withParent?1:level;
                    for(;i<=level;i++){
                        if(i!=(withParent?1:level)){ sql += ` union `;}
                        var max = userSSDWBMGet.getUserMixValue(i+"");
                        sql+=` SELECT DEPARTMENTNAME,DEPARTMENTID,D_LEVEL from A4_SYS_DEPARTMENT WHERE "BITAND"('${max}','${obj.deptId}') = DEPARTMENTID  AND CATEGORY = '行政区划'`;
                    }
                    sql+=` ORDER BY D_LEVEL  `;
                    var options = {maxRows :500};
                    dal.queryObjects(sql,{},options,function(err,data){
                        if(err){
                            callback(err);
                        }else{
                            var result = {};
                            var tmp = {};
                            for(var i=data.length-1;i>=0;i--){
                                tmp["name"] = data[i]["DEPARTMENTNAME"];
                                tmp["id"] = data[i]["DEPARTMENTID"];
                                tmp["level"]=data[i]["D_LEVEL"];
                                if(i!=data.length-1){ 
                                    tmp["children"]=[result]; 
                                }else{
                                    tmp["children"]=getLower;
                                }
                                result = tmp;
                                tmp = {};
                            }
                            callback(null,result);
                        }
                    });
                }else{
                    callback("找不到对应部门");
                }
            },
        },function(err,data){
            dal.close(function(){});
            if(err){
                callback(err);
            }else{
                if(data&&data["getDept"]){
                    callback(err,[data["getDept"]]);
                }else{
                    callback("找不到对应部门");
                }
            }
        });
    }, 
    /**
     * 当点击3级节点不显示第四节点信息
     */
    getUserDataDepartByParent1:function(userDepId,parentId,callback,HaveGateGory){
        var dal = new departmentAccess();
        async.autoInject({
            "open":dal.open.bind(dal,false),
            "userDep":function(open,callback){
                if(userDepId){
                    dal.getObject({departmentId:`${userDepId}`},callback);
                }
                else{
                    dal.getObject({level:1},callback);
                }
            },
            "userDataDep":function(userDep,callback){
                if(!userDep)callback(new Error("没有找到用户单位"));
                else{
                    dal.getObject({departmentId:`${userDep.dataDepartmentId}`},function(err,dep){
                        if(err){
                            callback(err);
                        }
                        else{
                            callback(null,dep?dep:userDep);
                        }
                    });
                }
            },
            "parentDep":function(open,callback){
                if(parentId){
                    dal.getObject({departmentId:`${parentId}`},callback);
                }
                else{
                    callback(null,null);
                }
            },
            "parentDepFilter":function(parentDep,callback){
                if(parentDep){
                    services.getDepFilter(parentDep,"DEPARTMENTID",callback);
                }
                else{
                    callback(null,null);
                }
            },
            "depFilter":function(userDataDep,callback){
                services.getDepFilter(userDataDep,"DEPARTMENTID",callback);
            },
            "children":function(userDataDep,depFilter,parentDep,parentDepFilter,callback){
                //对参数进行判断看是否加限制条件
                if(HaveGateGory=="0"){
                    var filter = {
                    "ssdw":depFilter,
                    "category":categoryArea,
                    "level":((parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1)==4?-1:((parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1)
                    }
                }else if(HaveGateGory=="1"){
                    var filter = {
                    "ssdw":depFilter,
                    "level":(parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1
                    }
                }
                
                if(parentDepFilter){
                    filter["parentSsdw"] = parentDepFilter;
                }
                dal.getObjects(filter,{departmentOrder:true},callback);
            }
        },function(err,res){
            dal.close(function(){});
            if(err)callback(err);
            else{
                callback(null,res.children.map(function(item){
                    return {
                        "id":item.departmentId,
                        "name":item.departmentName,
                    }
                }));
            }
        });
    },
    /**
     * 网格区域选择
     */
    getUserDataDepartByParentHaveIt: function (userDepId, parentId,type, callback, HaveGateGory) {
        var dal = new departmentAccess();
        async.autoInject({
            "open": dal.open.bind(dal, false),
            "userDep": function (open, callback) {
                if (userDepId) {
                    dal.getObject({ departmentId: `${userDepId}` }, callback);
                }
                else {
                    dal.getObject({ level: null }, callback);
                }
            },
            "userDataDep": function (userDep, callback) {
                if (!userDep) callback(new Error("没有找到用户单位"));
                else {
                    dal.getObject({ departmentId: `${userDep.dataDepartmentId}` }, function (err, dep) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            callback(null, dep ? dep : userDep);
                        }
                    });
                }
            },
            "parentDep": function (open, callback) {
                if (parentId) {
                    dal.getObject({ departmentId: `${parentId}` }, callback);
                }
                else {
                    callback(null, null);
                }
            },
            "parentDepFilter": function (parentDep, callback) {
                if (parentDep) {
                    services.getDepFilter(parentDep, "DEPARTMENTID", callback);
                }
                else {
                    callback(null, null);
                }
            },
            "depFilter": function (userDataDep, callback) {
                services.getDepFilter(userDataDep, "DEPARTMENTID", callback);
            },
            "children": function (userDataDep, depFilter, parentDep, parentDepFilter, callback) {
                //对参数进行判断看是否加限制条件
                var filter = {
                        "ssdw": depFilter,
                        "category": categoryArea,
                                }
                if (HaveGateGory == "0") {//网格长
                    filter.level= ((parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1)==4?-1:((parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1)
                } else if (HaveGateGory == "1") {//网格指导员
                    filter.level=((parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1)==3?-1:((parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1)
                }
                else if (HaveGateGory == "2") {
                    if(type=="1"){//网格长
                        if(parentDep.level=="3"||parentDep.level=="4"){
                            filter.level=(parentDep ? parseInt(parentDep.level) : parseInt(userDataDep.level))
                        }else{
                            filter.level=-1;
                        }
                    }else if(type=="2"){//网格指导员
                        filter.level=(parentDep ? parseInt(parentDep.level) : parseInt(userDataDep.level))
                        
                    }else{
                        filter.level=(parentDep ? parseInt(parentDep.level) : parseInt(userDataDep.level)) + 1
                    }
                    
                }

                if (parentDepFilter) {
                    filter["parentSsdw"] = parentDepFilter;
                    dal.getObjects(filter, { departmentOrder: true }, callback);
                }else{
                    var resultObject=[userDataDep];
                    callback(null,resultObject);
                }
            }
        }, function (err, res) {
            dal.close(function () { });
            if (err) callback(err);
            else {
                if(type=="2"){//网格指导员
                        if(parentId==""){
                            callback(null,[]);
                        }else{
                                callback(null, res.children.map(function (item) {
                                return {
                                    "id": item.departmentId,
                                    "name": item.departmentName,
                                    "level":item.level
                                }
                            }));
                        }
                    }else{
                        callback(null, res.children.map(function (item) {
                                return {
                                    "id": item.departmentId,
                                    "name": item.departmentName,
                                    "level":item.level
                                }
                            }));
                    }
                
            }
        });
    },

     getDepartByLevel:function(userDepId,parentId,callback,HaveGateGory){
        var dal = new departmentAccess();
        async.autoInject({
            "open":dal.open.bind(dal,false),
            "userDep":function(open,callback){
                if(userDepId){
                    dal.getObject({departmentId:`${userDepId}`},callback);
                }
                else{
                    dal.getObject({level:1},callback);
                }
            },
            "userDataDep":function(userDep,callback){
                if(!userDep)callback(new Error("没有找到用户单位"));
                else{
                    dal.getObject({departmentId:`${userDep.dataDepartmentId}`},function(err,dep){
                        if(err){
                            callback(err);
                        }
                        else{
                            callback(null,dep?dep:userDep);
                        }
                    });
                }
            },
            "parentDep":function(open,callback){
                if(parentId){
                    dal.getObject({departmentId:`${parentId}`},callback);
                }
                else{
                    callback(null,null);
                }
            },
            "parentDepFilter":function(parentDep,callback){
                if(parentDep){
                    services.getDepFilter(parentDep,"DEPARTMENTID",callback);
                }
                else{
                    callback(null,null);
                }
            },
            "depFilter":function(userDataDep,callback){
                services.getDepFilter(userDataDep,"DEPARTMENTID",callback);
            },
            "children":function(userDataDep,depFilter,parentDep,parentDepFilter,callback){
                //对参数进行判断看是否加限制条件
                if(HaveGateGory=="0"){
                    var filter = {
                    "ssdw":depFilter,
                    "category":categoryArea,
                    "level":((parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1)==3?-1:((parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1)
                    }
                }else if(HaveGateGory=="1"){
                    var filter = {
                    "ssdw":depFilter,
                    "level":(parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1
                    }
                }
                
                if(parentDepFilter){
                    filter["parentSsdw"] = parentDepFilter;
                }
                dal.getObjects(filter,{departmentOrder:true},callback);
            }
        },function(err,res){
            dal.close(function(){});
            if(err)callback(err);
            else{
                callback(null,res.children.map(function(item){
                    return {
                        "id":item.departmentId,
                        "name":item.departmentName,
                    }
                }));
            }
        });
    },
    limitQueryDept:function(user,query,idText,callback){
        if(!query[idText]){
            query[idText] = user.userDataDepartmentId;
            callback(null,query);
        }else{
            var dal = new dataAccess();
            async.series([
                dal.open.bind(dal,false),
                function(callback){
                    var sql = ` SELECT D_LEVEL AS "level" from a4_sys_department where departmentid = :deptId `;
                    dal.queryObject(sql,{deptId:user.userDataDepartmentId},function(err,result){
                        if(err||!result)callback(err?err:"未找到当前用户部门等级");
                        else{
                            callback(null,result["level"]);
                        }
                    });
                },
                function(callback){
                    var sql = ` SELECT D_LEVEL AS "level" from a4_sys_department where departmentid = :deptId `;
                    dal.queryObject(sql,{deptId:query[idText]},function(err,result){
                        if(err||!result)callback(err?err:"未找到查询部门等级");
                        else{
                            callback(null,result["level"]);
                        }
                    });
                }
            ],function(err,result){
                if(err)callback(err);
                else{
                    var userLevel = parseInt(result[1]);
                    var queryLevel = parseInt(result[2]);
                    if(userLevel>=queryLevel){
                        query[idText] = user.userDataDepartmentId;
                    }
                    callback(null,query);
                }
            });
        }
    },
     /**
     * @description 获取用户单位的数据权限下的单位 ---按CATEGORY NULLS FIRST 排序
     * @param {String} userDepId 用户单位
     * @param {String} parentId  想要获取下级单位的
     * @param {String} HaveGateGory 查询所有单位 0||1
     * @param {String} orderFlag 是否按CATEGORY NULLS FIRST 排序 0||1 1是
     * @param {AsynCallback} callback
     */
    getDataDepartByParent:function(query,callback){
        var dal = new departmentAccess();
        async.autoInject({
            "open":dal.open.bind(dal,false),
            "userDep":function(open,callback){
                if(query.userDepId){
                    dal.getObject({departmentId:`${query.userDepId}`},callback);
                }
                else{
                    dal.getObject({level:1},callback);
                }
            },
            "userDataDep":function(userDep,callback){
                if(!userDep)callback(new Error("没有找到用户单位"));
                else{
                    dal.getObject({departmentId:`${userDep.dataDepartmentId}`},function(err,dep){
                        if(err){
                            callback(err);
                        }
                        else{
                            callback(null,dep?dep:userDep);
                        }
                    });
                }
            },
            "parentDep":function(open,callback){
                if(query.parentId){
                    dal.getObject({departmentId:`${query.parentId}`},callback);
                }
                else{
                    callback(null,null);
                }
            },
            "parentDepFilter":function(parentDep,callback){
                if(parentDep){
                    services.getDepFilter(parentDep,"DEPARTMENTID",callback);
                }
                else{
                    callback(null,null);
                }
            },
            "depFilter":function(userDataDep,callback){
                services.getDepFilter(userDataDep,"DEPARTMENTID",callback);
            },
            "children":function(userDataDep,depFilter,parentDep,parentDepFilter,callback){
               //对参数进行判断看是否加限制条件
               if(query.HaveGateGory=="0"){
                    var filter = {
                    "ssdw":depFilter,
                    "category":categoryArea,
                    "level":(parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1
                    }
                }else if(query.HaveGateGory=="1"){
                    var filter = {
                    "ssdw":depFilter,
                    "level":(parentDep ? parseInt(parentDep.level):parseInt(userDataDep.level))+1
                    }
                }
                
                if(parentDepFilter){
                    filter["parentSsdw"] = parentDepFilter;
                }
                if (query.orderFlag=="1") {
                    dal.getObjects(filter,['CATEGORY NULLS FIRST'],callback);
                } else {
                    dal.getObjects(filter,{departmentOrder:true},callback);
                }
            }
        },function(err,res){
            dal.close(function(){});
            if(err)callback(err);
            else{
                callback(null,res.children.map(function(item){
                    return {
                        "id":item.departmentId,
                        "name":item.departmentName,
                        "category":item.category,
                    }
                }));
            }
        });
    },
    getAllZjDeptTree:function(callback){
        var dal = new dataAccess();
        async.series([
            dal.open.bind(dal,false),
            function(callback){
                var sql = `select OID AS "oid",PID AS "pid",name as "name",to_number(ORDERBY) as "orderby" from ZJ_SYS_ORG ORDER BY to_number(ORDERBY) `;
                dal.queryObjects(sql,{},{ maxRows:  3000},callback);
            }
        ],function(err,res){
            dal.close(function(){});
            if(err)callback(err);
            else{
                if(res&&res[1]){
                    var parent = {
                        oid:"0",
                        pid:null,
                        name:"请选择",
                        orderby:0
                    }
                    var result = getNodesforZj(res[1],parent);
                    callback(null,result); 
                }else{
                    callback("找不到对应部门");
                }
            }
        });
    },
};

/**
 * @description 递归填充子类
 * @param {*} datas 
 * @param {*} parent 
 */
function getNodes(datas, parent) {
    var result = [], temp;
    for (var i = 0; i < datas.length; i++) {
        if (datas[i].parentId == parent.id && datas[i].level > parent.level) {
            temp = getNodes(datas, datas[i]);
            if (temp.length > 0) {
                datas[i].nodes = temp;
            }
            result.push(datas[i]);
        }
    }
    return result;
}
/**
 * @description 浙江省部门树查询递归填充子类
 * @param {*} datas 
 * @param {*} parent 
 */
function getNodesforZj(datas, parent) {
    var result = [], temp;
    for (var i = 0; i < datas.length; i++) {
        if (datas[i].pid == parent.oid) {
            temp = getNodesforZj(datas, datas[i]);
            if (temp.length > 0) {
                datas[i].nodes = temp;
            }
            result.push(datas[i]);
        }
    }
    return result;
}
module.exports = services;