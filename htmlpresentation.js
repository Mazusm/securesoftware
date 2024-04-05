const express = require("express");
const business = require("./business.js");
const bodyParser = require("body-parser");
const handlebars = require("express-handlebars");
const cookieParser = require("cookie-parser");

app = express();
app.set("views", __dirname + "/templates");
app.set("view engine", "handlebars");
app.engine("handlebars", handlebars.engine());
let urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(urlencodedParser);
app.use(cookieParser());

app.get("/", async (req, res) => {
  let key = req.cookies.session;
  let message = await business.getFlash(key);
  let sd = undefined;
  if (key) {
    sd = await business.getSession(key);
  }
  if (sd && sd.data.username !== "") {
    res.redirect("/dashboard");
  }
  res.render("login", {
    layout: undefined,
    message: message,
  })
});

app.post("/", async (req, res) => {
  let username = req.body.uname;
  let password = req.body.pword;
  //console.log(`${username} ${password}`);
  let type = await business.userType(username, password);
  if (type === 'customer') {
    let key = await business.startSession({ username: username });
    res.cookie("session", key);
    res.redirect("/dashboard");
    return;
  }else if(type === 'admin'){
    let key = await business.startSession({ username: username });
    res.cookie("session", key);
    res.redirect('/dashbord')
  } 
  else {
    let key = await business.startSession({ username: "" });
    await business.setFlash(key, "Invalid Credentials has been entered");
    res.cookie("session", key);
    res.redirect("/")
  }
});

app.get("/logout", async (req, res) => {
  let key = await business.startSession({ username: "" });
  await business.setFlash(key, "Logged out");
  res.cookie("session", key);
  res.redirect("/");
  return
});

async function isAuthenticated(session) {
  if (!session) {
    return false;
  }
  let sd = await business.getSession(session);
  if (!sd) {
    return false;
  }
  if (sd.data.username == "") {
    return false
  }
  return true;
}

app.get("/dashboard", async (req, res) => {
  let key = req.cookies.session;
  if (!(await isAuthenticated(key))) {
    let key = await business.startSession({ username: "" });
    await business.setFlash(key, "Please login");
    res.cookie("session", key);
    res.redirect("/");
    return;
  }

  res.render("main", { layout: undefined });
});

app.get("/application", async (req, res) => {
  let key = req.cookies.session;
  if (!key || !(await isAuthenticated(key))) {
    let key = await business.startSession({ username: "" });
    await business.setFlash(key, "Please login");
    res.cookie("session", key);
    res.redirect("/");
    return;
  }
  let apps = await business.getApplications();
  let token = await business.generateFormToken(key);
  res.render("applications", {
    layout: undefined,
    applications: apps,
    csrfToken: token,
  });
});

app.post("/approve", async (req, res) => {
  console.log("trying the approve");
  let key = req.cookies.session;
  console.log(`key = ${key}`);
  if (!key || !(await isAuthenticated(key))) {
    let key = await business.startSession({ username: "" })
    await business.setFlash(key, "Please login");
    res.cookie("session", key)
    res.redirect("/");
    return;
  }
  let details = await business.getSession(key);
  let token = req.body.OTtoken;
  let email = req.body.email;
  if (token == undefined || token != details.csrfToken) {
    res.status(419);
    res.send("CSRF token mismatch");
    return;
  }
  await business.approveRegistration(email);
  res.redirect("/application");
});

app.get("/registration", async (req, res) => {
  res.render("registration", { layout: undefined });
});

app.post("/registration", async (req, res) => {
  // save registration details and redirect to / with a message
  let name = req.body.name;
  let email = req.body.email;
  let description = req.body.description;
  await business.registerUser(name, email, description);
  let key = await business.startSession({ username: "" });
  await business.setFlash(key, "New user has been registered successfully. ");
  res.cookie("session", key)
  res.redirect("/");
});

app.listen(8000, () => {
  console.log("Application started");
});
