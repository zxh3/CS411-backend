const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const port = process.env.PORT || 2018;

const con = mysql.createConnection({
  host     : "us-cdbr-iron-east-01.cleardb.net",
  user     : 'b2fc8aa7f18dfc',
  password : '954e9bb3',
  database : 'heroku_55fd2caa4bdc19e'
});

con.connect((err) => {
  console.error(err);
  return;
});

app.get('/', (req, res) => {
  res.json({eatmoodBackend: 'yoxi'});
})

app.get('/dishes/:ingredientName', (req, res) => {
  const q = `SELECT dishName FROM dishIngredient WHERE ingredientName='${req.params.ingredientName}';`
  con.query(q, (err, results) => {
    if (!err) {
      console.log(results);
      res.json({results});
    } else {
      res.json({error: err});
    }
  });
});

app.delete('/dishes/:dishName', (req, res) => {
  const q = `DELETE FROM dish WHERE name='${req.params.dishName}'`;
  console.log(q);
  con.query(q, (err, results) => {
    if (!err) {
      console.log(results);
      res.json({success: 0});
    } else {
      res.json({error: err})
    }
  });
})

app.get('/ingredients/:dishName', (req, res) => {
  const q = `SELECT ingredientName FROM dishIngredient WHERE dishName='${req.params.dishName}'`;
  con.query(q, (err, results) => {
    if (!err) {
      console.log(results);
      res.json(results);
    } else {
      res.json({error: err});
    }
  });
});

app.get('/restaurants/:dishName', (req, res) => {
  const q = `SELECT restaurantName FROM dishRestaurant WHERE dishName='${req.params.dishName}'`;
  con.query(q, (err, results) => {
    if (!err) {
      console.log(results);
      res.json(results);
    } else {
      res.json({error: err});
    }
  })
});

app.post('/addDish', (req, res) => {
  let { dishName, ingredients } = req.body;
  let dishIngredient = ingredients.map(ingredient => [dishName, ingredient]);
  ingredients = ingredients.map(x => [x]);
  console.log('dishName: ', dishName);
  console.log('ingredients: ', ingredients);
  console.log('dishIngredient: ', dishIngredient);
  console.log(dishName, ingredients);

  let q = `SELECT * FROM dish WHERE name='${dishName}'`;
  con.query(q, (err, results) => {
    console.log('results: ', results);
    if (!err) {
      if (results && results.length > 0 ) {
        res.json({error: `Dish already exists.`});
      } else {
        
        let q1 = `INSERT INTO dish VALUES ('${dishName}');`;
        let q2 = `INSERT IGNORE INTO ingredient (name) VALUES ?`;
        let q3 = `INSERT IGNORE INTO dishIngredient (dishName, ingredientName) VALUES ?`;

        con.query(q1, (err) => {
          if (!err) {
            con.query(q2, [ingredients], (err) => {
              if (!err) {
                con.query(q3, [dishIngredient], (err) => {
                  if (!err) {
                    console.log('success addDish');
                    res.json({success: 0});
                    return;
                  } else {
                    res.json({error: err});
                    return;
                  }
                })
              } else {
                res.json({error: err});
                return;
              }
            })
          } else {
            res.json({error: err});
            return;
          }
        });
      }
    } else {
      res.json({error: err});
      return;
    }
  });
});

app.put('/dishes', (req, res) => {
  const oldName = req.body.oldName;
  const newName = req.body.newName;
  const q = `UPDATE dish SET name='${newName}' WHERE name='${oldName}'`;
  con.query(q, (err) => {
    if (!err) {
      res.json({success: 0});
    } else {
      res.json({error: err});
    }
  });
});

app.listen(port, () => console.log(`listening on port ${port}`));