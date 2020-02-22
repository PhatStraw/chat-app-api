require("dotenv").config();
var app = require("express")();
var session = require("express-session");
var grant = require("grant-express");
var http = require("http").createServer(app);
var morgan = require("morgan");
var bp = require("body-parser");

app.use(
  bp.urlencoded({
    extended: true
  })
);

app.use(bp.json());

app.use(morgan("dev"));

app.use(session({ secret: "grant" }));
// mount grant

app.use(
  grant({
    "github": {
        "key": process.env.GH_ID, "secret": process.env.GH_SECRET,
        "scope": ["public_repo"],
        "callback": "/connect/github/callback"
      }
  })
);

app.get("/", function(req, res) {
  res.send("<h1>Hello world</h1>");
});

app.post("/connect/github/callback", function(req, res) {
    console.log(req.query);
    res.send(200)
  });

http.listen(process.env.PORT, function() {
  console.log(`listening on *:${process.env.PORT}`);
});
