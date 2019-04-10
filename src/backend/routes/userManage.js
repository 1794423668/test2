const { webRes, webReq, async } = require("@cig/restbase").tools;
const config = require(ROOT_DIR + "/common/config/options");
var userManageService = require(ROOT_DIR + "/common/service/userManageService");
var userService = require(ROOT_DIR + "/common/service/system/userService");
var actions = {

    $$beforeAction(req, res, actionInfo, callback) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With ');
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By", 'CIG');

        callback(null);
    },
    //获取用户的信息路径传参
    getUserObject: function (req, res) {
        //获取信息并截取作为查询条件
        var query = req.params;
        var str = query[0].toString().split("/");
        var UserId = str[2].toUpperCase();

        // 调account服务查询方法
        userManageService.getUserObject(UserId, userManageService.exportJson.bind(null, res));

        // });
    },
    /**
     * 查询当前网格下的用户
     */
    getCurrentUser: {
        post: function (req, res) {
            //获取传递参数
            userService.getCurUser(req, function (err, user) {
                if (err) {
                    webRes.exportJson(res, err);
                }
                else {
                    var query = userManageService.getQueryBody(req, {
                        sszzbsInfo: "",
                        limit: 10,
                        offset: 0,
                        sort: "Rkrq",
                        order: "desc",
                        search: "",
                        searchType: "0"//0本级 1 本级及以下
                    });
                    userManageService.getCurrentUser(user, query, function (err, resdata) {
                        if (resdata) {
                            res.send({ 'success': true, rows: resdata.rows, total: resdata.total });
                        } else {
                            res.send({ 'success': false, "errMsg": err });
                        }
                    });
                }
            });
        }
    },
    
    //插入新用户
    addUserInsert: {
        post: function (req, res) {
            //获取传递参数
            var query = userManageService.getQueryParam(req, {
                ISADMIN: "0",//是否管理员
                ISSTATE: "1",//是否启用
                Ssdwbs: 0,
                Lrr: "",
                Rkrq: "",
                UserId: "",
                //2018.7.26修改去掉组织字段
                Sszzbs: "",
                Password: "",
                UserName: "",
                UserPosition: "",
                Lxdh: "",
                Dzyj: "",
                Bz: "",
            });
            userManageService.addUserServices(query, webRes.exportJson.bind(null, res));
        }
    },

    //验证手机号
    checkPhone: function (req, res) {
        var query = {};
        query.lxdh = req.query.lxdh
        // 调account服务查询方法
        userManageService.checkPhone(query, function (err, resdate) {
            if (resdate == "0") {
                res.send({ 'success': true, "Msg": "可以使用" });
            }
            else {
                res.send({ 'success': false, "Msg": "手机号码已经被注册" });
            }
        });

        // });
    },
    //20180910
    //验证userid
    checkUserId: function (req, res) {
        var query = {};
        query.UserId = req.query.UserId
        // 调account服务查询方法
        userManageService.checkUserId(query, function (err, resdate) {
            if (resdate == "0") {
                res.send({ 'success': true, "Msg": "可以使用" });
            }
            else {
                res.send({ 'success': false, "Msg": "用户名已经被注册" });
            }
        });
    },
    //验证初始密码{"0":{"UserId":"admin","Password":"123456"}}
    checkPassword: {
        post: function (req, res) {
            var query = req.body;
            // 调account服务查询方法
            userManageService.checkPassword(query, function (err, resdate) {
                if (resdate == "1") {
                    res.send({ 'success': true, "Msg": "验证成功" });
                }
                else {
                    res.send({ 'success': false, "Msg": "原密码错误" });
                }
            });
        }
    },
    /**
     * 修改密码
     */ 
    ModifyPassword: {
        post: function (req, res) {
            var queryUser = req.params;
            var str = queryUser[0].toString().split("/");
            var UserId = str[2].toUpperCase();
            var query = req.body;
            userManageService.ModifyPassword(UserId, query, function (err, resdata) {
                if (err) {
                    res.send({ 'success': false, "errMsg": err });
                } else {
                    res.send({ 'success': true });
                }
            });
        }
    },

    Config: function (req, res) {
        userService.getCurUser(req, function (err, user) {
            if (err) {
                webRes.exportJson(res, err);
            } else {
                var cookies = typeof (req) == "string" ? req : req.headers['cookie'];
                cookies = typeof (cookies) == "string" ? cookie.parse(cookies) : cookies;
                token = cookies['CIGToken'];
                var str = `function SysManager_CurrentUser(){this.UserId='${cookies.CIGUserid}';this.UserName='${cookies.CIGUsername}';this.Ssdwdm=${user.userDepartmentId};this.token='${token}'}`
                res.send(str)
            }
        });
    },
}
module.exports = actions;