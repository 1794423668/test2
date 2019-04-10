var async = require("@cig/restbase/tools").async;
var dataAccess = require("@cig/restbase").dataAccess;
var userManageAccess = require(ROOT_DIR + "/common/dal/usermanageAccess");
var iamChatKeyAccess = require(ROOT_DIR + "/common/dal/iamChatKeyAccess");
var departmentAccess = require(ROOT_DIR + "/common/dal/system/departmentAccess");
var config = require(ROOT_DIR + "/common/config/options");
var userSSDWBMGet = require(ROOT_DIR + "/common/unit/userSSDWBMGet");
const crypto = require("crypto");//加密
var request = require('request');
var that = {

    //查询用户信息的服务接口 接受用户,筛选条件,回调函数
    getUserObject: function (UserId, callback) {
        // 设定筛选条件根据路径参数进行查询当前用户信息
        var filter = { UserId: UserId };
        // query.sort = query.sort + " " + query.order
        // 创建表引用
        var icka = new iamChatKeyAccess(null);
        async.series([
            icka.open.bind(icka, false),//打开表进行操作
            //查询数据,根据封装的查询方法选择传递的参数
            icka.getServicesPage.bind(icka, filter),
        ], function (err, data) {
            icka.close(function () { });//关闭数据库
            var rows = [data[1]]
            // rows = data[1];//整理得到数据,回调
            callback(err, rows);
        });
    },
    //查询用户信息的服务接口 接受用户,筛选条件,回调函数
    getCurrentUser: function (user, query, callback) {
        var dal = new dataAccess();
        var icka = new iamChatKeyAccess(null, dal);
        var depAcc = new departmentAccess(null, dal);
        //判断是否是政府级别(政府级别编码特殊)
        if (query.sszzbsInfo.length > 18) {
            async.autoInject({
                "open": dal.open.bind(dal, false),//打开表进行操作
                "getCurrentUser": function (open, callback) {
                    // 设定筛选条件根据路径参数进行查询当前用户信息
                    if (query.searchType == 1) {//本级及以下级别
                        var filter = {
                            "or": { UserId: { type: "like", vals: `%${query.search}%`.toUpperCase() }, DepartmentDisplayName: { type: "like", vals: `%${query.search}%` }, UserName: { type: "like", vals: `%${query.search}%` }, lxdh: { type: "like", vals: `%${query.search}%` } }
                            , "and": { "dep1.classid": query.sszzbsInfo }
                        };
                        query.sort = query.sort + " " + query.order
                        icka.getUserListTwo(query.offset, query.limit, filter, query.sort, callback);
                    } else {
                        //政府级别不允许有用户所以直接返回空
                        callback(null, { rows: [], total: 0 })
                    }

                }
            }, function (err, data) {
                dal.close(function () { });//关闭数据库
                var resData = data.getCurrentUser;
                //截取时间格式,只留取yyyy-mm-dd
                if (resData != null && resData && !err) {
                    for (var i = 0; i < resData.rows.length; i++) {
                        resData.rows[i].Rkrq = resData.rows[i].Rkrq.toISOString().slice(0, 10);
                    }
                }
                // rows = data[1];//整理得到数据,回调
                callback(err, resData);
            });
        } else {
            async.autoInject({
                "open": dal.open.bind(dal, false),//打开表进行操作
                "getlv": function (open, callback) {//查询级别用来计算其子集
                    var filter = {
                        departmentId: query.sszzbsInfo
                    }
                    depAcc.getObject(filter, function (err, data) {
                        if (err) {
                            callback(err, null)
                            // } else if (data != null && data.level > user.userLevel || user.userLevel == 1) {
                        } else {
                            callback(null, data)
                        }
                    });
                },
                "getCurrentUser": function (getlv, callback) {
                    // 设定筛选条件根据路径参数进行查询当前用户信息
                    if (getlv != null) {
                        if (query.searchType == 0) {
                            var filter = {
                                "or": { UserId: { type: "like", vals: `%${query.search}%`.toUpperCase() }, DepartmentDisplayName: { type: "like", vals: `%${query.search}%` }, UserName: { type: "like", vals: `%${query.search}%` }, lxdh: { type: "like", vals: `%${query.search}%` } }
                                , "and": { 'Ssdwbs': query.sszzbsInfo }
                            };
                        } else {
                            var fmax = userSSDWBMGet.getUserMixValue(getlv.level + "").toString();
                            var filter = {
                                "or": { UserId: { type: "like", vals: `%${query.search}%`.toUpperCase() }, DepartmentDisplayName: { type: "like", vals: `%${query.search}%` }, UserName: { type: "like", vals: `%${query.search}%` }, lxdh: { type: "like", vals: `%${query.search}%` } }
                                , "and": { "Ssdwbs": { type: "bitand", vals: [fmax, query.sszzbsInfo + ""] }, "state": 1 }
                            };
                        }
                        query.sort = query.sort + " " + query.order
                        icka.getUserListPage(query.offset, query.limit, filter, query.sort, callback);
                    } else {
                        callback(null, { rows: [], total: 0 })
                    }

                }
            }, function (err, data) {
                dal.close(function () { });//关闭数据库
                var resData = data.getCurrentUser;
                if (resData != null && resData && !err) {
                    for (var i = 0; i < resData.rows.length; i++) {
                        resData.rows[i].Rkrq = resData.rows[i].Rkrq.toISOString().slice(0, 10);
                    }
                }
                callback(err, resData);
            });
        }
    },
    //添加用户信息
    addUserServices: function (user, callback) {
        //userID变大写
        user.UserId = user.UserId.toUpperCase();

        // 创建表引用
        var icka = new userManageAccess(null);
        async.series([
            icka.open.bind(icka, false),//打开表进行操作
            //查询数据,根据封装的查询方法选择传递的参数
            icka.addUserInsert.bind(icka, user),
        ], function (err, data) {
            icka.close(function () { });//关闭数据库
            callback(err, "添加成功");;//整理得到数据,回调
        });
    },//添加用户信息
    checkPhone: function (user, callback) {
        var dal = new dataAccess();
        var icka = new userManageAccess(null, dal);
        var filter = { lxdh: user.lxdh };
        // var sql = "SELECT * FROM A4_SYS_USER WHERE LXDH='" + user.lxdh + "'"
        async.autoInject({
            open: dal.open.bind(dal, false),//打开表进行操作
            data: ["open", function (open, callback) {
                //查询数据,根据封装的查询方法选择传递的参数
                icka.getObjects(filter, {}, callback)
            }]
        }, function (err, data) {
            icka.close(function () { });//关闭数据库
            if (data.data.length == 0) {
                callback(err, "0");//整理得到数据,回调
            } else {
                callback(err, "1");//整理得到数据,回调
            }
        });
    },
    //20180910
    checkUserId: function (user, callback) {
        var dal = new dataAccess();
        var icka = new userManageAccess(null, dal);
        var filter = { UserId: user.UserId.toUpperCase() };
        async.autoInject({
            open: dal.open.bind(dal, false),//打开表进行操作
            data: ["open", function (open, callback) {
                //查询数据,根据封装的查询方法选择传递的参数
                icka.getObjects(filter, {}, callback)
            }]
        }, function (err, data) {
            icka.close(function () { });//关闭数据库
            if (data.data.length == 0) {
                callback(err, "0");//整理得到数据,回调
            } else {
                callback(err, "1");//整理得到数据,回调
            }
        });
    },
    checkPassword: function (query, callback) {
        var dal = new dataAccess();
        var userAcc = new userManageAccess(null, dal);
        for (var key in query) {
            var msg = query[key];
        }
        var pasw = md5(msg.UserId.toLowerCase() + msg.Password);
        var filter = { UserId: msg.UserId.toUpperCase(), Password: pasw };
        async.autoInject({
            open: dal.open.bind(dal, false),//打开表进行操作
            data: ["open", function (open, callback) {
                //查询数据,根据封装的查询方法选择传递的参数
                userAcc.getObjects(filter, {}, callback)
            }]
        }, function (err, data) {
            dal.close(function () { });//关闭数据库
            if (data.data.length == 0) {
                callback(err, "0");//整理得到数据,回调
            } else {
                callback(err, "1");//整理得到数据,回调
            }
        });
    },
    ModifyPassword: function (UserId, query, callback) {
        var dal = new dataAccess();
        var userAcc = new userManageAccess(null, dal);
        // var filter = {EventId:EventId};
        for (var key in query) {
            var msg = query[key];
        }
        if (msg.NewPwd1 == msg.NewPwd2) {
            async.autoInject({
                "open": dal.open.bind(dal, false),
                "checkPass": function (open, callback) {
                    var pwd = md5(UserId.toLowerCase() + msg.OldPwd);
                    var filter = { UserId: UserId.toUpperCase(), Password: pwd };
                    userAcc.getObjects(filter, {}, callback)
                },
                "updatePass": function (checkPass, callback) {
                    if (checkPass.length <= 0) {
                        callback(null, 0)
                    } else {
                        var Password = md5(UserId.toLowerCase() + msg.NewPwd1);
                        userAcc.update({ PASSWORD: Password }, { UserId: UserId }, callback);
                    }
                }
            }, function (err, data) {
                dal.close(function () { });//关闭数据库
                if (err) {
                    callback(err, null)
                } else if (data.updatePass == 0) {
                    callback("原密码错误", null)
                } else {
                    callback(null, data)
                }
            });
        } else {
            callback("两次密码不一致", null)
        }
    },
    
    //获取页面传来的post提交json参数
    getQueryParam: function (req, defObj) {
        //md5加密
        var query = req.body.UserId;
        var result = {};
        for (var key in defObj) {
            if (defObj.hasOwnProperty(key)) {
                var defVal = defObj[key];
                result[key] = typeof (query[key]) != "undefined" ? query[key] : defVal;
            }
        }
        result.Password = md5(result.UserId.toLowerCase() + result.Password);
        //nodejs内置转变数值造成省略不精确问题解决
        if (typeof result.Ssdwbs != "string") {
            result.Ssdwbs = "" + result.Ssdwbs;
        }

        return result;
    },
    getQueryBody: function (req, defObj) {
        //md5加密
        var query = req.body;
        var result = {};
        for (var key in defObj) {
            if (defObj.hasOwnProperty(key)) {
                var defVal = defObj[key];
                result[key] = typeof (query[key]) != "undefined" ? query[key] : defVal;
            }
        }
        return result;
    },
    //query获取查询条件
    getParam: function (req, defObj) {
        var query = req.query;
        var res = {};
        for (var key in defObj) {
            if (defObj.hasOwnProperty(key)) {
                var defVal = defObj[key];
                res[key] = typeof (query[key]) != "undefined" ? query[key] : defVal;
            }
        }


        return res;
    },
    exportJson: function (res, err, data) {
        res.set({ 'Content-Type': 'text/json', 'Encodeing': 'utf8' });
        res.status(200);
        if (err) {
            console.log(err);
            var msg = typeof err == "string" ? err : err.message;
            res.send({ 'success': 0, "errMsg": msg });
        }
        else {
            res.send({ 'success': true, "rows": data });
        }
    },


};
module.exports = that;
var ids = [];
// function getId(data) {
//     if (data.nodes != undefined) {
//         // ids.push("'" + data.id + "'");
//         ids.push(parseInt(data.id));
//         if (data.id == "1125899906842624") {
//             return ids;
//         }
//         for (let i = 0; i < data.nodes.length; i++) {
//             getId(data.nodes[i]);
//         }
//     } else {
//         // ids.push("'" + data.id + "'");
//         ids.push(parseInt(data.id));
//     }
//     return ids;
// }
function md5(sInput) {
    return crypto.createHash('md5').update(sInput).digest('hex').toUpperCase();
}