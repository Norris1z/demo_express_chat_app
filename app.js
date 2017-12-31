var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var index = require('./routes/index');
var csrf = require('csurf');
var session = require('express-session');
var app = express();
var validator = require('express-validator');
var flash = require('express-flash');
var passport = require('passport');
var User = require('./models/user');

mongoose.connect(process.env.MONGODB_URI);

// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(validator({
  customValidators:{
    isImage:function(value,file){
      return (file && file.mimetype.match(String.raw`^image/.+$`))
    }
  }
}));

app.use(cookieParser());
app.use(session({
  secret: 'a4f8071f-c873-4447-8ee2',
  cookie: { maxAge: 2628000000 },
  saveUninitialized: true,
  resave: false,
  store: new (require('express-sessions'))({
      storage: 'mongodb',
      instance: mongoose, 
      host: 'ds135537.mlab.com',  
      port: 35537, 
      db: 'chat', 
      collection: 'sessions', 
      expire: 86400
  })
}));
app.use(csrf());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.serializeUser(function(user, done) {
  done(null, user._id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  }).select({password:0});
});

app.use((request,response,next)=>{
  response.locals.csrf = request.csrfToken();
  response.locals.authUser = request.user;
  response.locals.userInUrl = request.query.user;
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

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
console.log(err);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
