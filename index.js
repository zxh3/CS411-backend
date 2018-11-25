const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const port = process.env.PORT || 2018;

const db_config = {
  host     : "us-cdbr-iron-east-01.cleardb.net",
  user     : 'b2fc8aa7f18dfc',
  password : '954e9bb3',
  database : 'heroku_55fd2caa4bdc19e'
};

let con = mysql.createConnection(db_config);

function handleDisconnect() {
  con = mysql.createConnection(db_config); // Recreate the connection, since
                                                  // the old one cannot be reused.

  con.connect(function(err) {              // The server is either down
    if(err) {                                     // or restarting (takes a while sometimes).
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }                                     // to avoid a hot loop, and to allow our node script to
  });                                     // process asynchronous requests in the meantime.
                                          // If you're also serving http, display a 503 error.
  con.on('error', function(err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
      handleDisconnect();                         // lost due to either server restart, or a
    } else {                                      // connnection idle timeout (the wait_timeout
      throw err;                                  // server variable configures this)
    }
  });
}

handleDisconnect();


app.get('/', (req, res) => {
  res.json({eatmoodBackend: 'yoxi'});
});

// app.get('/dishes/:ingredientName', (req, res) => {
//   const q = `SELECT dishName FROM dishIngredient WHERE ingredientName='${req.params.ingredientName}';`
//   con.query(q, (err, results) => {
//     if (!err) {
//       console.log(results);
//       res.json({results});
//     } else {
//       res.json({error: err});
//     }
//   });
// });

app.get('/dishes/:ingredientName', (req, res) => {
  //var ingredients = req.params.ingredientName.split(',');
  let ingredients = req.params.ingredientName.split(',').map(x => x.trim());
  // let dishIngredient = ingredients.map(ingredient => [dishName, ingredient]);
  // ingredients = ingredients.map(x => [x]);
  let i = 0;
  q = `SELECT d${i}.dishName FROM dishIngredient AS d${i} WHERE d${i}.ingredientName LIKE '%${ingredients[i]}%'`;
  for (i = 1; i < ingredients.length; i++) { 
      q += ` AND d0.dishName IN (SELECT d${i}.dishName FROM dishIngredient AS d${i} WHERE d${i}.ingredientName LIKE '%${ingredients[i]}%')`;
  }
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
  const q = `SELECT ingredientName FROM dishIngredient WHERE dishName='%${req.params.dishName}%'`;
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

// app.post('/authentication', (req, res) => {
//   let { email, username, password, passwordMatch } = req.body;
//   console.log(email, username, password, passwordMatch);
//   let q = `SELECT * FROM user WHERE name='${username}'`;
//   con.query(q, (err, results) => {
//     console.log('results: ', results);
//     if (!err) {
//       if (results && results.length > 0 ) {
//         res.json({error: `username already exists.`});
//         return;
//       } else {
        
//         q = `INSERT INTO user (email, username, password) VALUES ?`;
//         con.query(q, (err, results) => {
//           if (!err) {
//             console.log('results:', results);
//             res.json({asd: 123});
//             return;
//           } else {
//             res.json({error: err});
//             return;
//           }
//         });

//       }
//     } else {
//       res.json({error: err});
//       return;
//     }

//   });
// });

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