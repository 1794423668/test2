const { httpUnit, cache, async} = require("@cig/restbase").tools;
const dataAccess= require("@cig/restbase").dataAccess;
var cookie = require("cookie");
var options = require(ROOT_DIR + "/common/config/options");
var departmentUserAcc = require(ROOT_DIR+"/common/dal/system/departmentUserAccess");
var departService = require(ROOT_DIR+"/common/service/system/departService");
var userPostService = require(ROOT_DIR+"/common/service/system/userPostService");

function parseJsonInXml(data) {
    //返回xml,<string>里面是json</string>看能不能返回json。然后解析
    var res = data.substring(data.indexOf("{"), data.lastIndexOf("}") + 1);
    res = JSON.parse(res.trim());
    return res;
}

var services = {
    /**
     * @description 获取当前登陆的用户
     * @param {NSExpress.Request|string} req Request 或者是 Cookie字符串
     * @param {AsyncCallback} callback
     */
    getCurUser:function(req, callback) {
        //callback(null, { userId: "LIQIANQING", userName: "李倩青", userDepartmentId: "1143492092887040",userDataDepartmentId:"1143492092887040",userDepartmentName:"稚城街道",jdDepartmentId:"1143492092887040", userLevel: 1, isAdmin: 0 });
        var cookies = typeof (req) == "string" ? req : req.headers['cookie'];
        var token = null;
        if (cookies) {
            cookies = typeof (cookies) == "string" ? cookie.parse(cookies) : cookies;
            token = cookies['CIGToken'];
        }
        if(token){
            cache.cacheTask("TOKEN_"+token,300,getUserByToken.bind(null,token),callback);
        } else {
            callback("Token为空", null);
        }
        function getUserByToken(token,callback){
            httpUnit.request({
                url:options.tokenservice+"/GetTokenInfo?Token="+token,
            },function(err,result){
                if(err){
                    callback(err,null);
                }
                else {
                    var data = result["data"];
                    if(data.trim()){
                        try{
                            data = JSON.parse(data.trim());
                        }
                        catch(e){
                            callback(e);
                            return;
                        }
                        var user = { 
                            userId: data.YHZH,
                            token: token,
                            userDepartmentId: `${data.SSDWBS}`, 
                            userLevel: data.DLEVEL, 
                            isAdmin: data.ISADMIN,
                            token: token 
                        };
                        async.auto({
                            dep:departService.getDepartById.bind(departService,user.userDepartmentId),
                            dataDep:['dep', function(results, cb) {
                                var dep = results.dep;
                                if(dep.dataDepartmentId==dep.departmentId){
                                    cb(null,dep);
                                }
                                else{
                                    departService.getDepartById(`${dep.dataDepartmentId}`,cb);
                                }
                            }],
                            parentsDep:departService.getDepartParents.bind(departService,user.userDepartmentId),
                            post:userPostService.getPostInfo.bind(userPostService,user.userId),//获取用户岗位信息
                            // files:fileService.getFiles.bind(fileService,{id:user.userId,fileType:"per-image"}),//头像
                            userInfo:services.getUserInfoById.bind(services,user.userId)//个人信息
                        },function(err,res){
                            if(res&&res.userInfo){
                                user.userName = res.userInfo.userName?res.userInfo.userName:"",
                                //user.userDepartmentId = res.userInfo.departmentId?res.userInfo.departmentId:"",
                                user.isAdmin = res.userInfo.isAdmin?res.userInfo.isAdmin:"",
                                user.phone = res.userInfo.phone?res.userInfo.phone:"";
                                user.email = res.userInfo.email?res.userInfo.email:"";    
                            }
                            if(res&&res.dep){
                                user.userDepartmentName = res.dep.departmentName;
                                user.userDepartmentLevel = res.dep.level;
                                user.userDepartmentCategory = res.dep.category;
                                user.userLevel = res.dep.level;
                                if(res.dataDep){
                                    user.userDataDepartmentId = `${res.dep.dataDepartmentId}`;
                                    user.userDataDepartmentLevel = `${res.dataDep.level}`;
                                    user.userDataDepartmentName = `${res.dataDep.departmentName}`;
                                }
                                else{
                                    user.userDataDepartmentId = `${res.dep.departmentId}`;
                                    user.userDataDepartmentLevel = `${res.dep.level}`;
                                    user.userDataDepartmentName = `${res.dep.departmentName}`;
                                }
                            }
                            if(user.userDepartmentLevel == 2 && user.userDepartmentCategory == "行政区划"){
                                user.isJdUser = true;
                                user.jdDepartmentId = `${user.userDepartmentId}`;
                                user.jdDepartmentName = `${user.userDepartmentName}`;
                            }else{
                                if(res&&res.parentsDep){
                                    res.parentsDep.forEach(function(element) {
                                        if(element.level == 2 && element.category == "行政区划"){
                                            user.isJdUser = true;
                                            user.jdDepartmentId = `${element.departmentId}`;
                                            user.jdDepartmentName = `${element.departmentName}`;
                                        }
                                    }, this);
                                }else{
                                    user.isJdUser = false;
                                }
                            }
                            if(res&&res.post){
                                user.post = res.post.length>0?res.post[0].post:"网格员";//用户第一个职位
                            }
                            // if(res&&res.files){
                            //     user.avatar = res.files.length>0?(res.files[0].thumbnail?res.files[0].thumbnail.visitPath:res.files[0].visitPath):"";
                            // }
                            callback(err, user);
                        })
                   }
                    else{
                        callback("登陆已失效", null);
                    }
                }
            });
        }
    },
    getUserInfoById: function(userId, callback) {
        var dal = new dataAccess();
        var acc = new departmentUserAcc(null,dal);
        var filter = {
            "userId": userId
        };
        async.series([
            acc.open.bind(acc, false),
            acc.getObject.bind(acc, filter)
        ], function(err,data){
            acc.close(function(){});
            if (err)
                callback(err);
            else {
                callback(null, data[1]);
            }
        });
    },
};
module.exports = services;
