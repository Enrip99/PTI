const express = require('express')
const app = express()
const port = 8080
var schedule = require('node-schedule');


var tasks = []

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.use(express.json());

app.listen(port, () => {
  console.log(`HTTP Server listening at http://localhost:${port}`)
})

app.get("/plants", (req, res, next) => {
  res.json({
    joblist: tasks
  });
});

app.post('/createPlant', (req, res, next) => {
  console.log(req.body);
  tasks.push(schedule.scheduleJob(req.body.secs + ' * * * * *', function(){  // this for one hour
    console.log('Output: ' + req.body.text);
  }))
  res.end();
})
