const { webRes, webReq, async } = require("@cig/restbase").tools;
const config = require(ROOT_DIR + "/common/config/options");
const departmentService = require(ROOT_DIR + "/common/service/departmentService");
var userService = require(ROOT_DIR + "/common/service/system/userService");

// var userSSDWBMGet = require(ROOT_DIR + "/common/unit/userSSDWBMGet");
xlsx = require("node-xlsx")
var fs = require("fs")
var actions = {
    $$beforeAction(req, res, actionInfo, callback) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With ');
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.header("X-Powered-By", 'CIG');
        callback(null);
    },
    exportExcl: {
        post: function (req, res) {
            userService.getCurUser(req, function (err, user) {
                if (err) {
                    webRes.exportJson(res, err);
                }
                else {
                    var params = req.body
                    var obj = webReq.getParam(req, {
                        data: "",
                        fileName: "系统管理用户列表"
                    })

                    departmentService.exportExcl(params,user,function (err, arr) {
                        for (var i = 0; i < arr[0].length; i++) {
                            switch (arr[0][i]) {
                                case 'UserId':
                                    arr[0][i] = '账号'
                                    break;
                                case 'UserName':
                                    arr[0][i] = '姓名'
                                    break;
                                case 'DepartmentDisplayName':
                                    arr[0][i] = '网格'
                                    break;
                                case 'UserType':
                                    arr[0][i] = '类型'
                                    break;
                                case 'ActiveType':
                                    arr[0][i] = '禁用'
                                    break;
                                case 'Rkrq':
                                    arr[0][i] = '登记'
                                    break;
                                case 'Lxdh':
                                    arr[0][i] = '联系电话'
                                    break;
                            }
                        }
                        var d = new Date();
                        var date = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
                        obj.fileName = obj.fileName + date
                        if (err) {
                            var msg = typeof err == "string" ? err : err.message;
                            res.send({ 'success': 0, "errMsg": msg });
                        }
                        else {
                            var path = ROOT_DIR + "/common/downLoad/" + obj.fileName + ".xlsx"
                            buffer = xlsx.build([{ name: obj.fileName, data: arr }])
                            fs.writeFileSync(path, buffer, 'binary')
                            res.download(path, function (err, data) {
                                if (fs.existsSync(path)) {
                                    fs.unlinkSync(path);
                                }
                            })
                        }
                    })
                }
            });
        }
    },


}
module.exports = actions;