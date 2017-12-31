var express = require('express');
var router = express.Router();
var upload = require('express-fileupload');
var randomstring = require('randomstring');
var path = require('path');
var User = require('../models/user');
var Chat = require('../models/chat');
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy

passport.use('login',new LocalStrategy({passReqToCallback:true},function(req,username,password,done){
    User.findOne({username:req.body.username},function(error,user){
      if(error) return done(error);

      if(!user){
        return done(null,false,req.flash('auth_error','Sorry you cannot login with these credentials'));
      }

      if(!bcrypt.compareSync(req.body.password,user.password)){
        return done(null,false,req.flash('auth_error','Sorry you cannot login with these credentials'));
      }

      return done(null,user);
    });
}));

/* GET home page. */
router.get('/',redirectIfAuthenticated,function(req, res, next) {
  res.render('index');
});

router.get('/signup',redirectIfAuthenticated,function(req,res){
  res.render('signup');
});

router.post('/signup',upload(),function(req,res,next){
  req.checkBody('username','Username cannot be empty').notEmpty();
  req.checkBody('password','Password cannot be empty').notEmpty();
  req.checkBody('picture','picture must be an image').isImage(req.files.picture);

  const errors = req.validationErrors();
  if(errors){
    req.flash('error',JSON.stringify(errors));
    res.redirect('/signup');
  }else{
    const filename = randomstring.generate(60)+req.files.picture.name.match(String.raw`\.[^.]+$`)[0];
    req.files.picture.mv(path.join('public','images','userUploads',filename),(error)=>{
      if(error) next(error);
    });
    
    User.findOne({username:req.body.username},function(error,user){
      if(error) return next(error);
      if(user){
        req.flash('user_exists','User exists');
        return res.redirect('/signup');
      }
      let newUser = new User({
        username: req.body.username,
        password: bcrypt.hashSync(req.body.password),
        picture: filename
      });
      newUser.save();
      req.flash('info',"Registration Successful");
      return res.redirect('/'); 
    });
  }
});

router.post('/login',passport.authenticate('login',{
  successRedirect: '/chat',
  failureRedirect: '/',
  failureFlash : true 
}));

router.get('/chat',isAuthenticated,function(req,res,next){
  Promise.all([
    User.find().where('username').ne(req.user.username).
    select({'username':1,'picture':1,'_id':1}).sort({createdAt:"descending"}),
    Chat.find().or([{sender:req.user._id},{recipient:req.user._id}]).
    sort({createdAt:"descending"})
  ]).then(([users,chats])=>{
    res.render('chat',{users:users,chats:chats});
  })
});


router.post('/logout',isAuthenticated,function(req,res){
  req.logout();
  res.redirect('/');
});

function isAuthenticated(req,res,next){
  if (req.isAuthenticated()) return next();
  req.flash('req_auth','You must be authenticated to view this page!');
  res.redirect('/');
};

function redirectIfAuthenticated(req,res,next){
  if(req.isAuthenticated()) return res.redirect('/chat');
  return next();
}

module.exports = router;
