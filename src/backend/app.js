var path = require('path');
var appDir = __dirname;
var rootDir = appDir;// path.join(appDir,"/..");
const restbase = require("@cig/restbase");
restbase.initDir(appDir, rootDir);
restbase.config(require("./common/config/db"));

var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));//日志
app.use(bodyParser.json());//body解析后才能json 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//路由
restbase.handleRoute(app, "/", path.join(appDir, "routes"));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    console.log(err);
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});

module.exports = app;