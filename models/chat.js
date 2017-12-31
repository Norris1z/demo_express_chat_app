const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let chatSchema = mongoose.Schema({
    sender: {type: Schema.Types.ObjectId, ref: 'user'},
    recipient: {type: Schema.Types.ObjectId, ref: 'user'},
    message: {type:String,required:true},
    date: {type:Date,default:Date.now()}
});

let chat = mongoose.model('chat',chatSchema);

module.exports = chat;