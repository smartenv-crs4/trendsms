var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var queryHandler = require('express-api-queryhandler');
var boom = require('express-boom');


var index = require('./routes/index');
var trends = require('./routes/trends');

var prefix = '';


var Mongoose = require('mongoose');

Mongoose.Promise = require('bluebird');
// MongoDB Connection
Mongoose.connect('mongodb://seidue.crs4.it:3996/trends', function () {
  console.log("Connected");
});


var app = express();

app.set('port', process.env.PORT || '3000');
app.set("apiprefix", prefix);

app.use(queryHandler.fields());
app.use(queryHandler.filter());
//app.use(queryHandler.pagination());
app.use(boom());

var paginate = require('express-paginate');
app.use(paginate.middleware(10, 50));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(prefix, trends);



var audoku = require('audoku');


var url = "http://localhost:3000";
audoku.apidocs({
  metadata: {
    "name": "Api Seidue",
    "version": "1.0.0",
    "title": "Seidue API",
    "url": "http://localhost:3000",
    "header": {
      "title": "API Overview",
      "content": "<p>A wonderful set of APIs</p>"
    },
    "footer": {
      "title": "Maintained by CRS4",
      "content": "<p>Codebase maintained by CRS4</p>\n"
    }
  },
  app: app,
  docspath: '/docs',
  routers: [
    {
      basepath: "http://localhost:"+ app.get('port')+prefix ,
      router: trends
    }]
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
