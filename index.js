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
  let ingredients = req.params.ingredientName.split(',').map(x => x.trim());
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

app.get('/reviewsName/:dishName', (req, res) => {
  const q = `SELECT reviewid FROM dishreview WHERE dishName='${req.params.dishName}'`;
  con.query(q, (err, results) => {
    if (!err) {
      console.log(results);
      res.json(results);
    } else {
      res.json({error: err});
    }
  })
});

app.get('/reviewsId/:reviewId', (req, res) => {
  const q = `SELECT content, rating FROM review WHERE id='${req.params.reviewId}'`;
  con.query(q, (err, results) => {
    if (!err) {
      console.log(results);
      res.json(results);
    } else {
      res.json({error: err});
    }
  })
});

app.get('/types/:type', (req, res)=> {
  const q = `SELECT name FROM dish WHERE type='${req.params.type}';`
  con.query(q, (err, results) => {
    if (!err) {
      console.log(results);
      res.json({results});
    } else {
      res.json({error: err});
    }
  });
});


app.post('/addDish', (req, res) => {
  let { dishName, ingredients, dishType } = req.body;
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
        
        let q1 = `INSERT INTO dish VALUES ('${dishName}', '${dishType}');`;
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

app.post('/addReview', (req, res) => {
  let { dishName, reviewContent, dishRating } = req.body;
  // console.log('dishName: ', dishName);
  // console.log('reviewContent: ', reviewContent);
    let q1 = `INSERT INTO review (content, rating) VALUES ('${reviewContent}', '${dishRating}');`;
    con.query(q1, (err) => {
      if (!err) {
        let q2 = `SELECT LAST_INSERT_ID()`;
        con.query(q2, (err, results) => {
          if (!err){
              //console.log("lastinsertid: ", results[0]['LAST_INSERT_ID()']);
              let rid = results[0]['LAST_INSERT_ID()'];
              let q3 =`INSERT INTO dishReview VALUES ('${rid}', '${dishName}')`;
              con.query(q3, (err) => {
                if (!err) {
                  console.log('success addReview');
                  res.json({success: 0});
                  return;
                } else {
                  res.json({error: err});
                  return;
                }
              });
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
});

app.get('/reviews/:dishName', (req, res) => {
  const q = `SELECT content, rating FROM review r JOIN dishReview d ON r.id = d.reviewid WHERE dishName='${req.params.dishName}'`;
  con.query(q, (err, results) => {
    if (!err) {
      console.log(results);
      res.json(results);
    } else {
      res.json({error: err});
    }
  })
});

app.post('/addDishRes', (req, res) => {
  let { dishName, resName } = req.body;

  let q = `SELECT * FROM restaurant WHERE name='${resName}'`;

  con.query(q, (err, results) => {
    if (!err) {
      if (!results || results.length == 0) { // restaurant does not exist
        res.json({error: `restaurant does not exist`});
      } else {

        let q1 = `SELECT * FROM dishRestaurant WHERE restaurantName='${resName}' AND dishName='${dishName}'`;

          con.query(q1, (err, results) => {
            if (!err) {
              if (results && results.length > 0) { // dishRestaurant already exists
                res.json({error: `Restaurant exists for this dish`});
              } else {

                let q2 = `INSERT INTO dishRestaurant VALUES ('${dishName}', '${resName}');`;
                
                con.query(q2, (err) => {
                  if (!err) {
                    console.log('success addDish');
                    res.json({success: 0});
                    return;
                  } else {
                    res.json({error:err});
                    return;
                  }
                });
              }
            } else {
              res.json({error: err});
              return;
            }
          });
      }
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

app.get('/user/:email', (req, res) => {
  console.log('email: ', req.params.email);
  const q = `SELECT email from user WHERE email='${req.params.email}'`
  con.query(q, (err, result) => {
    if (!err) {
      res.json({success: result});
    } else {
      res.json({error: err});
    }
  })
});

app.post('/user', (req, res) => {
  let { email, name, imageUrl } = req.body;
  if (email === undefined || name === undefined) {
    res.json({error: 'field cannot be empty'});
  } else {
    let q = ''
    if (imageUrl === undefined) {
      q = `INSERT IGNORE INTO user(email, name) VALUES ('${email}', '${name}')`
    } else {
      q = `INSERT IGNORE INTO user VALUES ('${email}', '${name}', '${imageUrl}')`
    }
    con.query(q, (err, result) => {
      if (!err) {
        res.json({success: result});
      } else {
        res.json({error: err});
      }
    })
  }
})

app.listen(port, () => console.log(`listening on port ${port}`));