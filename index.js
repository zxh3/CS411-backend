const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const con = mysql.createConnection({
  host     : "localhost",
  user     : 'root',
  password : '1q2w3e4r!',
  database : 'eatmood2'
});

con.connect();

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


app.listen(2018, () => console.log(`listening on port 2018`));