require("dotenv").config();
var axios = require('axios').default;
var app = require("express")();
var session = require("express-session");
var grant = require("grant-express");
var http = require("http").createServer(app);
var morgan = require("morgan");
var bp = require("body-parser");
var mongoose = require("mongoose");
var {User, Message, Chat} = require('./schema.js')

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
    "defaults": {
        "protocol": "http",
        "host": "localhost:3000",
        "transport": "session",
        "state": true
    },

    "github": {
        "key": process.env.GH_ID, "secret": process.env.GH_SECRET,
        "scope": ["public_repo", "user"],
        "callback": "/oauth/github",
        "redirect_uri": "http://localhost:3000/oauth/github"
      }
  })
);

app.get("/", function(req, res) {
    console.log("HELLO")
    res.json({
        message: "hello!!!!"
    })
    // res.send("<h1>Hello world</h1>");
});

app.get("/oauth/github", async (req, res) => {
    let body = {
        code: req.query.code,
        client_id: process.env.GH_ID,
        client_secret: process.env.GH_SECRET
    }

    res.status(200).send()

    const result = await axios.post('https://github.com/login/oauth/access_token', body,
        {headers: {
            'Accept': 'application/json'
        }})

    const user = await axios.get('https://api.github.com/user', {headers: {
        'Authorization': `token ${result.data.access_token}`
    }})
    
    const found = await User.findOne({gh_id: user.data.id}).lean().exec()

    if(found) {
        console.log("Sign in")
    } else {
        var newUsr = await User.create({
            name: user.data.login,
            email: user.data.email || `${Date.now()}user@email.com`, 
            gh_id: user.data.id
        })
        console.log(newUsr.toObject())
    }
});


async function start(){
    await mongoose.connect('mongodb://localhost:27017/gh-chat', {
        useNewUrlParser: true
    })
    http.listen(process.env.PORT, function() {
        console.log(`listening on *:${process.env.PORT}`);
      });
}
start()