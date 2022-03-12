//jshint esversion:6
//a model that make environment variables
require("dotenv").config();

const express = require("express")
const bodyparser = require("body-parser")
const ejs =require("ejs")
const mongoose= require("mongoose")
//const encrypt = require("mongoose-encryption")
//const md5= require("md5")
const bcrypt = require("bcrypt")
const saltRounds =10;
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
//userSchema.plugin(encrypt,{secret : process.env.SECRET,encryptedFields : ["password"]});

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
      //checking if the bcrypt password with the saltRounds and the hashes is the same as the user req 
      bcrypt.compare(password, founduser.password, function(err, result) {
        if(result ===true){
                res.render("secrets")
        }
})
    }
  })
})

app.get("/register",function(req,res){
  res.render("register")
})


app.post("/register",function(req,res){
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        if(!err){
          const newuser = new User ({
            email : req.body.username,
            password: hash
          })
          newuser.save(function(err){
            if(err){
              console.log(err)
            }else{
              res.render("secrets")
            }
          })
        }else{
          console.log(err)
        }
   });
})

app.get("/submit",function(req,res){
  res.render("submit")
})


app.listen(3000,function(){
  console.log("server running on port 3000")
})
