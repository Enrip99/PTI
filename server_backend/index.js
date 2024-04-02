const schedule = require('node-schedule');
const express = require('express');
const mysql = require('mysql2');
const app = express()
const httpPort = 8080
app.use(express.json());

var tasks = []

//connecta amb base de dades
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "PlantUser",
  password: "verygay",
  database: "PlantManager"
})

/*
CREATE TABLE plants (
  id INT AUTO_INCREMENT PRIMARY KEY, 
  description VARCHAR(255) NOT NULL, 
  species VARCHAR(255) NOT NULL, 
  lights_on TIME NOT NULL, 
  lights_off TIME NOT NULL, 
  temp_min FLOAT NOT NULL, 
  temp_max FLOAT NOT NULL, 
  humidity_min FLOAT NOT NULL, 
  humidity_max FLOAT NOT NULL, 
  CHECK (temp_min < temp_max), 
  CHECK (humidity_min < humidity_max),
  CHECK (humidity_min >= 0),
  CHECK (humidity_max >= 0),
  CHECK (lights_on >= TIME '0:0:0'),
  CHECK (lights_on < TIME '24:0:0'),
  CHECK (lights_off >= TIME '0:0:0'),
  CHECK (lights_off < TIME '24:0:0')
);

CREATE TABLE lightRecords (
  measure_id INT AUTO_INCREMENT PRIMARY KEY,
  plant_id INT NOT NULL,
  measure BOOLEAN NOT NULL,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (plant_id) REFERENCES plants (id)
);

CREATE TABLE temperatureRecords (
  measure_id INT AUTO_INCREMENT PRIMARY KEY,
  plant_id INT NOT NULL,
  measure FLOAT NOT NULL,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (plant_id) REFERENCES plants (id)
);

CREATE TABLE humidityRecords (
  measure_id INT AUTO_INCREMENT PRIMARY KEY,
  plant_id INT NOT NULL,
  measure FLOAT NOT NULL,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (plant_id) REFERENCES plants (id),
  CHECK (measure >= 0)
);
*/

connection.connect((err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  };
  console.log(`Connected to the MySQL server at ${connection.config.user}@${connection.config.host}:${connection.config.port} using database ${connection.config.database}`);
});


//inicialitza servidor
const server = app.listen(httpPort, () => {
  console.log(`HTTP Server listening at http://localhost:${httpPort}`)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${httpPort} is already in use`);
    process.exit(2);
  }
});


app.get('/', (req, res) => {
  res.send("Test!")
})

app.get("/plants", (req, res, next) => {
  //llistat de totes les plantes
  
  connection.query('SELECT * FROM plants', function(err, results){
    res.json({
      plants: results
    });
  })
});

app.get("/plant/:id", (req, res, next) => {
  //informació de la planta
  //select * from plantes where id = :id + ultima d'aigua llum i calor

  // FALTA TEMP, LLUM I HUM

  const id = req.params.id;
  connection.query('SELECT * FROM plants WHERE id = ?', id, function(err, results){
    if (results.length){
      res.json({
        plant: results
      });
    }
    else{
      res.status(404).send(`Error 404: Plant ${id} is not in database.`);
    }
  })
});

app.get("/plant/:id/light", (req, res, next) => {
  //informació de la llum de la planta, mesures de les ultimes n hores
});

app.get("/plant/:id/temperature", (req, res, next) => {
  //informació de la temperatura de la planta, mesures de les ultimes n hores
});

app.get("/plant/:id/humidity", (req, res, next) => {
  //informació de la temperatura de la planta, mesures de les ultimes n hores
});

app.get("/species/:name", (req, res, next) => {
  //llista de plantes d'una especie
});

app.post('/createPlant', (req, res, next) => {
  //demana json amb els 8 camps (no id)
  //també, crea el job de les alarmes

  /* Espera:
      description: string
      species: string
      light_on: string (time HH:MM:SS)
      light_off: string (time HH:MM:SS)
      temp_min: float
      temp_max: float
      hum_min: float
      hum_min: float
  */
  console.log(req.body.xd)

  res.send("ok")
})

app.post('/modifyPlant', (req, res, next) => {
  //demana json amb els 9 camps, poden ser nuls (excepte id)
})

app.post('/deletePlant', (req, res, next) => {
  //demana json la id
})


//SCHEDULE EXEMPLE:
  /*
  console.log(req.body);
  tasks.push(schedule.scheduleJob('0 * * * * *', function(){  // this for one minute
    console.log('Output: ' + req.body.text);
  }))
  res.end();
  */

  //SQL EXEMPLE:
  /*
  let sentence = 'select * from plantas where owner = "Enric"';
  connection.query(sentence, function(err, results){
    res.json({
      joblist: results
    });
  })
  */