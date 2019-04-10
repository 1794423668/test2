var dataAccess = require("@cig/restbase").dataAccess;
var userInPostAccess = require(ROOT_DIR+"/common/dal/zhzl/userInPostAccess");
var userInRoleAccess = require(ROOT_DIR+"/common/dal/zhzl/userInRoleAccess");
var async = require("@cig/restbase/tools").async;

module.exports = {
    /**
     * 根据岗位ID查询人员信息
     */
    getUserInfoByPostId: function(postId, callback) {
        var dal = new dataAccess();
        var acc = new userInPostAccess(null,dal);
        var filter = {
            "postId": postId
        };

        async.series([
            acc.open.bind(acc, false),
            acc.getObjects.bind(acc, filter,"")
        ], function(err,data){
            acc.close(function(){});
            if (err)
                callback(err);
            else {
                callback(null, data[1]);
            }
        });
    },

    /**
     * 根据多个岗位ID查询人员信息
     * 参数形式：postId = 3001,3821
     */
    getUserInfoByPostIds: function(postId, callback) {
        if(postId!=""&&postId!=undefined){
            var ids  = postId.split(",");
        }
        var dal = new dataAccess();
        var acc = new userInPostAccess(null,dal);
        var filter = {
            "postId": {"type":"in",vals:ids}
        }

        async.series([
            acc.open.bind(acc, false),
            acc.getObjects.bind(acc, filter,"")
        ], function(err,data){
            acc.close(function(){});
            if (err)
                callback(err);
            else {
                callback(null, data[1]);
            }
        });
    },

    /**
     * @description 根据岗位名称获取人员信息
     * 参数形式 postName=受理员
     */
    getUserInfoByPostName: function(postName, callback) {
        var dal = new dataAccess();
        var acc = new userInPostAccess(null,dal);
        postName = acc.replaceLikeWildcards(postName);
        var filter = {
            "post": { type: "like", vals: `%${postName}%` }
        }
        async.series([
            acc.open.bind(acc, false),
            acc.getJoinPostObjects.bind(acc, filter,"")
        ], function(err,data){
            acc.close(function(){});
            if (err)
                callback(err);
            else {
                callback(null, data[1]);
            }
        });
    },

    /**
     * 根据用户ID查询用户岗位信息
     * 参数形式：userId = 
     */
    getPostInfo: function(userId, callback) {
        var dal = new dataAccess();
        var acc = new userInPostAccess(null,dal);
        var filter = {
            "userId": userId
        }

        async.series([
            acc.open.bind(acc, false),
            acc.getJoinPostObjects.bind(acc, filter,"")
        ], function(err,data){
            acc.close(function(){});
            if (err)
                callback(err);
            else {
                callback(null, data[1]);
            }
        });
    },
    getRoleInfo: function(userId, callback) {
        var dal = new dataAccess();
        var acc = new userInRoleAccess(null,dal);
        var filter = {
            "userId": userId
        }

        async.series([
            acc.open.bind(acc, false),
            acc.getJoinRoleObjects.bind(acc,filter,"")
        ], function(err,data){
            acc.close(function(){});
            if (err)
                callback(err);
            else {
                callback(null, data[1]);
            }
        });
    }
};