const mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    username: {type:String,required:true,unique:true},
    password: {type:String,required:true},
    picture: {type:String},
    status: {type:Boolean,default:true}
});

let user = mongoose.model('user',userSchema);

module.exports = user;