var async = require("@cig/restbase/tools").async;
var dataAccess = require("@cig/restbase").dataAccess;
// var userSSDWBMGet = require(ROOT_DIR + "/common/unit/userSSDWBMGet");
var request = require("request");
var config = require(ROOT_DIR + "/common/config/options");
var userManageService = require(ROOT_DIR + "/common/service/userManageService");

var that = {
    //到处excle
    exportExcl: function (params, user, callback) {
        var arr = []
        var title = params.field
        title = title.split(",")
        arr.push(title)
        var query = ""
        if (params.searchType == "0") {
            query = {
                sszzbsInfo: params.departmentId,
                limit: 100000,
                offset: 0,
                sort: "Rkrq",
                order: "desc",
                search: "",
                searchType:"0"
            }
            userManageService.getCurrentUser(user, query, function (err, data) {
                if (err) {
                    callback(err)
                }
                else {
                    for (var i = 0; i < data.rows.length; i++) {
                        var child = Array.from(data.rows[i]);
                        for (var j = 0; j < title.length; j++) {
                            var field = title[j]
                            child.push(data.rows[i][field])
                        }
                        arr.push(child)
                    }
                    callback(null, arr)
                }
            })
        }
        else {
            query = {
                sszzbsInfo: params.departmentId,
                limit: 100000,
                offset: 0,
                sort: "Rkrq",
                order: "desc",
                search: "",
                searchType:"1"
            }
            userManageService.getCurrentUser(user, query, function (err, data) {
                if (err) {
                    callback(err)
                }
                else {
                    for (var i = 0; i < data.rows.length; i++) {
                        var child = Array.from(data.rows[i]);
                        for (var j = 0; j < title.length; j++) {
                            var field = title[j]
                            child.push(data.rows[i][field])
                        }
                        arr.push(child)
                    }

                    callback(null, arr)
                }

            })
        }
    }
};
module.exports = that;
