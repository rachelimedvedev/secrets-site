//jshint esversion:6
//a model that make environment variables
require("dotenv").config();

const express = require("express")
const bodyparser = require("body-parser")
const ejs =require("ejs")
const mongoose= require("mongoose")
const encrypt = require("mongoose-encryption")
const app= express()


app.use(express.static("public"))
app.set('view engine','ejs')

app.use(bodyparser.urlencoded({extended: true}))


mongoose.connect("mongodb://127.0.0.1:27017/secretsDB")
//level 1 making username and pass to the site
const userSchema = new mongoose.Schema({
  email : String,
  password: String
});

//level 2 encrypt the data in the db with a secret encoding from env variable
userSchema.plugin(encrypt,{secret : process.env.SECRET,encryptedFields : ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/",function(req,res){
  res.render("home")
})

app.get("/login",function(req,res){
  res.render("login")
})

app.post("/login",function(req,res){
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({email : username}, function(err,founduser){
    if(err){
      console.log(err)
    }else{
      if(founduser.password === password){
        res.render("secrets")
      }
    }
  })
})

app.get("/register",function(req,res){
  res.render("register")
})


app.post("/register",function(req,res){
  const newuser = new User ({
    email : req.body.username,
    password: req.body.password
  })
  newuser.save(function(err){
    if(err){
      console.log(err)
    }else{
      res.render("secrets")
    }
  })
})

app.get("/submit",function(req,res){
  res.render("submit")
})


app.listen(3000,function(){
  console.log("server running on port 3000")
})
