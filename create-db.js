"use strict"

const fs = require('fs');
const Sqlite = require('better-sqlite3');

let db = new Sqlite('db.sqlite');

var entries = JSON.parse(fs.readFileSync('data.json').toString());
var load = function(filename) {
  const recipes = JSON.parse(fs.readFileSync(filename));

  db.prepare('DROP TABLE IF EXISTS recipe').run();
  db.prepare('DROP TABLE IF EXISTS ingredient').run();
  db.prepare('DROP TABLE IF EXISTS stage').run();

  db.prepare('CREATE TABLE recipe (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, img TEXT, description TEXT, duration TEXT)').run();
  db.prepare('CREATE TABLE ingredient (recipe INT, rank INT, name TEXT)').run();
  db.prepare('CREATE TABLE stage (recipe INT, rank INT, description TEXT)').run();

  var insert1 = db.prepare('INSERT INTO recipe VALUES (@id, @title, @img, @description, @duration)');
  var insert2 = db.prepare('INSERT INTO ingredient VALUES (@recipe, @rank, @name)');
  var insert3 = db.prepare('INSERT INTO stage VALUES (@recipe, @rank, @description)');

  var transaction = db.transaction((recipes) => {

    for(var id = 0;id < recipes.length; id++) {
      var recipe = recipes[id];
      recipe.id = id;
      insert1.run(recipe);
      for(var j = 0; j < recipe.ingredients.length; j++) {
        insert2.run({recipe: id, rank: j, name: recipe.ingredients[j].name});
      }
      for(var j = 0; j < recipe.stages.length; j++) {
        insert3.run({recipe: id, rank: j, description: recipe.stages[j].description});
      }
    }
  });

  transaction(recipes);

}

 
db.prepare('DROP TABLE IF EXISTS user').run();
db.prepare('CREATE TABLE user (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, name TEXT, password TEXT)').run();




load('data.json');