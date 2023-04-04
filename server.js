"use strict"
/* Serveur pour le site de recettes */
var express = require('express');
var mustache = require('mustache-express');

var model = require('./model');
var app = express();

app.use("/assets",express.static(__dirname +"/assets"));
app.use("/resources",express.static(__dirname +"/resources"));



const cookieSession = require('cookie-session');
app.use(cookieSession({
  secret: 'mot-de-pass-du-cookie',
}));

// parse form arguments in POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', './views');


/******middleware ******/
function isAuthenticated(req, res,next){
  /* */
  if (req.session.user != undefined ) {
    console.log("(req.session.name " + req.session.name);  

    res.locals.authenticated=true;    
    console.log("authenticated = true");  
  } else {
    res.locals.authenticated=false;
    console.log("authenticated = false");
  }
  return next();
}


/**** Routes pour voir les pages du site ****/
/* Retourne une page principale avec le nombre de recettes */
app.get('/',isAuthenticated, (req, res) => {
  res.render('index',{user_name:req.session.name});
});

/* Retourne les résultats de la recherche à partir de la requête "query" */
app.get('/search',isAuthenticated, (req, res) => {
 
  var found = model.search(req.query.query, req.query.page);
  console.log(req.session.user);
  
  res.render('search',found);

});

/* Retourne le contenu d'une recette d'identifiant "id" */
app.get('/read/:id', isAuthenticated,(req, res) => {
  var entry = model.read(req.params.id);
  res.render('read', entry);
});


app.get('/create',isAuthenticated, (req, res) => {
  res.render('create',{user_name:req.session.name});
});

app.get('/update/:id',isAuthenticated, (req, res) => {
  var entry = model.read(req.params.id);
  res.render('update', entry);
});

app.get('/delete/:id',isAuthenticated, (req, res) => {
  var entry = model.read(req.params.id);
  res.render('delete', {id: req.params.id, title: entry.title});
});

/**** Routes pour modifier les données ****/
// Fonction qui facilite la création d'une recette
function post_data_to_recipe(req) {
  return {
    title: req.body.title, 
    description: req.body.description,
    img: req.body.img,
    duration: req.body.duration,
    ingredients: req.body.ingredients.trim().split(/\s*-/).filter(e => e.length > 0).map(e => ({name: e.trim()})),
    stages: req.body.stages.trim().split(/\s*-/).filter(e => e.length > 0).map(e => ({description: e.trim()})),
  };
}

function user_info(req){
  return{
    username: req.body.name,
    id: req.body.id,
  };
}

app.post('/create', isAuthenticated,(req, res) => {
  var id = model.create(post_data_to_recipe(req));
  res.redirect('/read/' + id);
});

app.post('/update/:id',isAuthenticated, (req, res) => {
  var id = req.params.id;
  model.update(id, post_data_to_recipe(req));
  res.redirect('/read/' + id);
});

app.post('/delete/:id',isAuthenticated, (req, res) => {
  model.delete(req.params.id);
  res.redirect('/');
});



/**** Routes pour login et registration ****/

app.get('/login', (req,res) =>{
  res.render('login')
});

app.post('/login', (req,res) =>{
  const user = model.login(req.body.name,req.body.password);

  if (user != -1) {
    req.session.user = user;
    req.session.name = req.body.name;
    console.log("user_id_login: " + req.session.user);
    console.log("user_name_login: " + req.session.name);
    res.redirect('/userProfile');

  } else {
    console.log("not identification")
    res.redirect('/login');
  }
});


/******profile *****/

app.get('/userProfile',isAuthenticated,(req, res)=>{
  res.render('userProfile',{user_name:req.session.name});
})
/*******************/



/******logout******/
app.get('/logout', (req,res) => {
  req.session.user = null;
  req.session.name = null;   
  console.log("user_id_logout: " + req.session.user);
  console.log("user_name_logout: " + req.session.name);
  res.redirect('/');
 // res.render('logout',{user_name:req.session.name})
});


app.post('/logout', (req,res) => {
  req.session.user = null;
  console.log("user_id_logout: " + req.session.user);
  console.log("user_name_logout: " + req.session.name);
  res.redirect('/');
});

/******Register******/
app.get('/register', (req,res) =>{
  res.render('register')
});


app.post('/register', (req, res) => {
  if(!('password' in req.body && 'confirm_password' in req.body && 'name' in req.body)) {
    console.log("register 0")
    res.status(400).send('invalid request');
    return;
  }
  if(req.body.password != req.body.confirm_password) {
    console.log("register 1 "+req.session.name);
    res.redirect('/register');
  } else {
    const user = model.new_user(req.body.name, req.body.password);
    console.log("user: "+user);
    if(user != -1) {
      req.session.user = user;
      console.log("register 2 "+req.session.name);
      res.redirect('/login');
    } else {
      console.log("register 3 "+req.session.name);
      res.redirect('/register');  
    }
  }
});




  app.listen(3000, () => console.log('listening on http://localhost:3000'));



