//jshint esversion:6
//a model that make environment variables
require("dotenv").config();

const express = require("express");
const bodyparser = require("body-parser");
const ejs =require("ejs");
const mongoose= require("mongoose");
const session = require("express-session");
const passport= require("passport");
const passportlocalmongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate')
//const encrypt = require("mongoose-encryption")
//const md5= require("md5")
// const bcrypt = require("bcrypt")
// const saltRounds =10;
const app= express()


app.use(express.static("public"))
app.set('view engine','ejs')

app.use(bodyparser.urlencoded({extended: true}))

//set up session to have secret
app.use(session({
  secret: process.env.secret,
  resave :false,
  saveUninitialized: false
}))

//initialize passport and using it to manage session
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/secretsDB")

//level 1 making username and pass to the site
const userSchema = new mongoose.Schema({
  email : String,
  password: String,
  googleId : String,
  facebookId: String,
  secret: String
});

//set the schema to use the passportlocalmongoose as a plugin to it
userSchema.plugin(passportlocalmongoose);
userSchema.plugin(findOrCreate)

//level 2 encrypt the data in the db with a secret encoding from env variable
//userSchema.plugin(encrypt,{secret : process.env.SECRET,encryptedFields : ["password"]});

const User = new mongoose.model("User", userSchema);

//creating local login strategy
passport.use(User.createStrategy());
//set up passport to serialize and to deserialize user which mean to make and break coockies with any authentication
passport.serializeUser(function(user,done){
  done(null,user.id)
});
passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    done(err,user);
  })
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    //the same callbackURL as in the google api in google cloud
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: 'http://localhost:3000/login/facebook/secret'
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
  res.render("home")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));


app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
});

app.get('/login/facebook', passport.authenticate('facebook', {
  scope: [ 'email','profile' ]
}));


app.get('/login/facebook/secret',
  passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
  res.render("login")
})

app.get("/logout",function(req,res){
  //coming func in passport which logout automaticly users and deleting their coockie
  req.logout()
  //after loging out redirecting homepage
  res.redirect("/")
})

app.get("/secrets",function(req,res){
  User.find({"secret" : {$ne :null}},function(err,foundusers){
    if(err){
      console.log(err)
    }
    else{
      if(foundusers){
        res.render("secrets",{userwithsecrets : foundusers})
      }
    }
  })
})

app.post("/login",function(req,res){
  const user = new User({
    username: req.body.username,
    password : req.body.password
  })

//the login func is coming with the passport lib  and checking for us if the user can login with it credentials
  req.login(user,function(err){
    if(err){
      console.log(err)
    }else{
      //if login succeess we authenticate the user and making a coockie
      passport.authenticate("local")(req,res,function(){
        //because user is authenticated we dont have to render the secrets page we can redirect the user there.
        res.redirect("/secrets")
      })
    }
  })
})

app.get("/register",function(req,res){
  res.render("register")
})


app.post("/register",function(req,res){
  //a function in passportlocalmongoose which register the user
    User.register({username:req.body.username},req.body.password, function(err,user){
      if(err){
        console.log(err)
        res.redirect("/register")
      }else{
        //if not error it authenticates the user and make a coockie for him
        passport.authenticate("local")(req,res,function(){
          //because user is authenticated we dont have to render the secrets page we can redirect the user there.
          res.redirect("/secrets")
        })
      }
    })
})

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
  res.render("submit")}
  else{
    res.redirect("/login")
}})

app.post("/submit",function(req,res){
  const secretofuser =req.body.secret;
  const userid = req.user.id;
  User.findById(userid,function(err,founduser){
    if(err){
      console.log(err)
    }else{
      if(founduser){
        founduser.secret = secretofuser;
        founduser.save()
        res.redirect("/secrets")
      }
    }
  })
})

app.listen(3000,function(){
  console.log("server running on port 3000")
})
