var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    name:  {type: String, required: true}, 
    email: {type: String, required: true, unique: true},
    gh_id: {type: String, required: true, unique: true},
  });


var messageSchema = new Schema({
    from:  {type: mongoose.SchemaTypes.ObjectId, ref: "user",required: true}, 
    room: {type: mongoose.SchemaTypes.ObjectId, ref: "room", required: true},
    message: {type: String, required: true},
}, {timestamps: true});

var chatRoomSchema = new Schema({
    created_by:  {type: mongoose.SchemaTypes.ObjectId, ref: "user", required: true},
    members: [{type: mongoose.SchemaTypes.ObjectId, ref: "user"}],
    messages: [{type: mongoose.SchemaTypes.ObjectId, ref: "message"}],
    name: String
});


module.exports = {
    User: mongoose.model('user', userSchema),
    Message: mongoose.model('message', messageSchema),
    Chat: mongoose.model('chat', chatRoomSchema)
};
