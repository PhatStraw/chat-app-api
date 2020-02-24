require("dotenv").config();
var axios = require("axios").default;
var app = require("express")();
var session = require("express-session");
var grant = require("grant-express");
var http = require("http").createServer(app);
var io = require("socket.io")(http);
var morgan = require("morgan");
var bp = require("body-parser");
var mongoose = require("mongoose");
var ObjectId = require("mongoose").Types.ObjectId
var jwt = require('jsonwebtoken');
var { User, Message, Chat } = require("./schema.js");

app.use(
  bp.urlencoded({
    extended: true
  })
);

app.use(bp.json());

app.use(morgan("dev"));

app.use(session({ secret: "grraant" }));
// mount grant

app.enable("trust proxy");

app.use(
  grant({
    defaults: {
      protocol: "http",
      host: "localhost:3000",
      transport: "session",
      state: true
    },

    github: {
      key: process.env.GH_ID,
      secret: process.env.GH_SECRET,
      scope: ["public_repo", "user"],
      callback: "/oauth/github",
      redirect_uri: "http://localhost:3000/oauth/github"
    }
  })
);

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

//connect socket.io
io.on("connection", function(socket) {
  socket.on("chat message", function(msg) {
    console.log("message: " + msg);
  });
});

//authenticate a user with oAuth
app.get("/oauth/github", async (req, res) => {
  let body = {
    code: req.query.code,
    client_id: process.env.GH_ID,
    client_secret: process.env.GH_SECRET
  };

  const result = await axios.post(
    "https://github.com/login/oauth/access_token",
    body,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  const user = await axios.get("https://api.github.com/user", {
    headers: {
      Authorization: `token ${result.data.access_token}`
    }
  });

  let newUsr = await User.findOne({ gh_id: user.data.id })
    .lean()
    .exec();

  if (!newUsr) {
    newUsr = await User.create({
        name: user.data.login,
        email: user.data.email || `${Date.now()}user@email.com`,
        gh_id: user.data.id
      });
    newUsr = newUsr.toObject()
  
    var newChatroom = await Chat.create({
    created_by: newUsr._id,
    members: [newUsr._id],
    name: newUsr.name
    });
  
    console.log(newUsr);
    console.log(newChatroom.toObject());
  }

var token = jwt.sign({id: newUsr._id}, process.env.JWT_SECRET);
    console.log("TOKEN :",token)
  res.redirect(`/?token=${token}`, 301)
});

//create a new room
app.route('/new/room')
    .post(async function(request,response){
        var decoded = jwt.verify(request.headers.authorization, process.env.JWT_SECRET);
        var newChat = await Chat.create({
           created_by: decoded.id,
           members: [decoded.id],
           name: request.body.name
       })
       response.json(newChat.toObject())
    })

//del a room by id
app.route('/del/room')
    .post(async function(req,res){
        console.log(req.headers._id)
        var deletedDoc = await Chat.remove({ _id: ObjectId(req.headers._id)}).lean().exec()
        res.json(deletedDoc)
    })

async function start() {
  await mongoose.connect("mongodb://localhost:27017/gh-chat", {
    useNewUrlParser: true
  });
  http.listen(process.env.PORT, function() {
    console.log(`listening on *:${process.env.PORT}`);
  });
}
start();
