var configs = {
    workFlowService: {
        restApiUrlBaseForWF: process.env.REST_APIURLBASE_WF || "http://test-zhzl.spacecig.com/", //流程回调REST业务服务地址
    },
    tokenservice: process.env.TOKEN_SERVICE || "http://test-zhzl.spacecig.com/iam/admin"
}
module.exports = configs