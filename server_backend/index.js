const schedule = require('node-schedule');
const express = require('express');
const mysql = require('mysql2');
const app = express()
const port = 8080

var tasks = []

var counter = 0;

//************************** */
var connection = mysql.createConnection({
  host: "localhost",
  hostport: 3306,
  user: "PlantUser",
  password: "verygay",
  database: "PlantManager"
})

connection.connect((err) => {
  if (err) return console.error(err.message);

  console.log('Connected to the MySQL server.');
});

app.get('/', (req, res) => {
  res.send(counter++)
})
app.use(express.json());

app.listen(port, () => {
  console.log(`HTTP Server listening at http://localhost:${port}`)
})

app.get("/plants", (req, res, next) => {
  let sentence = 'select * from plantas where owner = "Enric"';
  connection.query(sentence, function(err, results){
    res.json({
      joblist: results
    });
  })
});

app.post('/createPlant', (req, res, next) => {
  console.log(req.body);
  tasks.push(schedule.scheduleJob(req.body.secs + ' * * * * *', function(){  // this for one hour
    console.log('Output: ' + req.body.text);
  }))
  res.end();
})
