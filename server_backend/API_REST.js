require('dotenv').config()
const mysql = require('mysql2');
const express = require('express');
const app = express();
app.use(express.json());
const fs = require('fs');
const http = require('http');
const https = require('https');
const privateKey  = fs.readFileSync(`${process.env.HTTPS_KEY}`, 'utf8');
const certificate = fs.readFileSync(`${process.env.HTTPS_CRT}`, 'utf8');
var credentials = {key: privateKey, cert: certificate};

const timeRegex = /^(?:[01]?[0-9]|2[0-3])(?::[0-5]?[0-9]){2}$/
const numRegex = /^[0-9]+$/

//connecta amb base de dades
var firstConnect = true;
const connectToDatabase = async () => {
  connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {rejectUnauthorized: false}
  });
  connection.connect((err) => {
    if (err) {
      console.error(`${new Date()} - Failed to connect to MySQL database.`);
      console.error(err.message);
      process.exit(1);
    };
    if (firstConnect) {
      console.log(`${new Date()} - Connected to the MySQL server at ${process.env.DB_USERNAME}@${process.env.DB_HOST}:${process.env.DB_PORT} using database ${process.env.DB_NAME}`);
      firstConnect = false;
    }
    else {
      console.log(`${new Date()} - Reconnected to database.`);
    }
    connection.stream.on('close', () => {
      console.log(`${new Date()} - Lost connection to database, reconnecting...`);
      connectToDatabase();
    });
  });
}

var connection = null;
connectToDatabase();

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(process.env.HTTPS_PORT, () => {
  console.log(`${new Date()} - HTTP Server listening at http://localhost:${process.env.HTTPS_PORT}`);
});

httpsServer.on('error', (error) => {  
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${process.env.HTTPS_PORT} is already in use`);
  }
  console.error(error);
  process.exit(2);
});

function requestError(error, response) {
  console.error(error);
  response.status(500).send("500 - Internal server error");
}

app.get('/', (req, res) => {
  res.status(200).send("Test!")
});

app.get("/plants", (req, res, next) => {
  //llistat de totes les plantes

  connection.query('SELECT * FROM plants', function (err, results) {
    if (err) return requestError(err, res);
    res.status(200).json({
      plants: results
    });
  })
});

app.get("/plant/:id", async (req, res, next) => {
  //informació de la planta
  //select * from plantes where id = :id + ultima d'aigua llum i calor
  const id = req.params.id;
  if (id.match(numRegex)) {
    let promises = [
      new Promise((resolve, reject) => connection.query('SELECT * FROM plants WHERE id = ?', id, function (err, results) { if (err) reject(err); else resolve(results) })),
      new Promise((resolve, reject) => connection.query('SELECT measure, timestamp FROM humidityRecords WHERE plant_id = ? ORDER BY timestamp DESC limit 1', id, function (err, results) { if (err) reject(err); else resolve(results) })),
      new Promise((resolve, reject) => connection.query('SELECT measure, timestamp FROM lightRecords WHERE plant_id = ? ORDER BY timestamp DESC limit 1', id, function (err, results) { if (err) reject(err); else resolve(results) })),
      new Promise((resolve, reject) => connection.query('SELECT measure, timestamp FROM temperatureRecords WHERE plant_id = ? ORDER BY timestamp DESC limit 1', id, function (err, results) { if (err) reject(err); else resolve(results) }))
    ];

    try {
      let results = await Promise.all(promises);

      if (!results[0].length) {
        res.status(404).send(`404 - Plant ${id} not found`);
      }
      else {
        res.status(200).json({
          plant: results[0][0],
          last_humidity: results[1][0],
          last_light: results[2][0],
          last_temperature: results[3][0],
        });
      }
    }
    catch (error) {
      requestError(err, res);
    }
  }
  else {
    res.status(400).send("400 - Bad request");
  }
});

app.get("/plant/:id/light/:hours", (req, res, next) => {
  //informació de la llum de la planta, mesures de les ultimes N hores

  let id = req.params.id;
  if (id.match(numRegex) && req.params.hours.match(numRegex)) {
    connection.query('SELECT measure, timestamp FROM lightRecords WHERE plant_id = ? AND timestamp > NOW() - INTERVAL ? HOUR ORDER BY timestamp;', [id, req.params.hours], async function (err, results) {
      if (err) return requestError(err, res);
      if (!results.length) {
        let checkExists = new Promise((resolve, reject) => connection.query('SELECT * FROM plants WHERE id = ?', id, function (err, res) { if (err) reject(err); else resolve(res) }));
        try {
          let resCheck = await checkExists;
          if (!resCheck.length) {
            res.status(404).send(`404 - Plant ${id} not found`);
          }
          else {
            res.status(200).json({
              results
            });
          }
        }
        catch (error) {
          requestError(err, res);
        }
      }
      else {
        res.status(200).json({
          results
        });
      }
    });
  }
  else {
    res.status(400).send("400 - Bad request")
  }
});

app.get("/plant/:id/temperature/:hours", (req, res, next) => {
  //informació de la temperatura de la planta, mesures de les ultimes N hores

  let id = req.params.id;
  if (id.match(numRegex) && req.params.hours.match(numRegex)) {
    connection.query('SELECT measure, timestamp FROM temperatureRecords WHERE plant_id = ? AND timestamp > NOW() - INTERVAL ? HOUR ORDER BY timestamp;', [id, req.params.hours], async function (err, results) {
      if (err) return requestError(err, res);
      if (!results.length) {
        let checkExists = new Promise((resolve, reject) => connection.query('SELECT * FROM plants WHERE id = ?', id, function (err, res) { if (err) reject(err); else resolve(res) }));
        try {
          let resCheck = await checkExists;
          if (!resCheck.length) {
            res.status(404).send(`404 - Plant ${id} not found`);
          }
          else {
            res.status(200).json({
              results
            });
          }
        }
        catch (error) {
          requestError(err, res);
        }
      }
      else {
        res.status(200).json({
          results
        });
      }
    })
  }
  else {
    res.status(400).send("400 - Bad request");
  }
});

app.get("/plant/:id/humidity/:hours", (req, res, next) => {
  //informació de la humetat de la planta, mesures de les ultimes N hores

  let id = req.params.id;
  if (id.match(numRegex) && req.params.hours.match(numRegex)) {
    connection.query('SELECT measure, timestamp FROM humidityRecords WHERE plant_id = ? AND timestamp > NOW() - INTERVAL ? HOUR ORDER BY timestamp;', [id, req.params.hours], async function (err, results) {
      if (err) return requestError(err, res);
      if (!results.length) {
        let checkExists = new Promise((resolve, reject) => connection.query('SELECT * FROM plants WHERE id = ?', id, function (err, res) { if (err) reject(err); else resolve(res) }));
        try {
          let resCheck = await checkExists;
          if (!resCheck.length) {
            res.status(404).send(`404 - Plant ${id} not found`);
          }
          else {
            res.status(200).json({
              results
            });
          }
        }
        catch (error) {
          return requestError(err, res);
        }
      }
      else {
        res.status(200).json({
          results
        });
      }
    });
  }
  else {
    res.status(400).send("400 - Bad request");
  }
});

app.get("/species/:name", (req, res, next) => {
  //llista de plantes d'una especie

  connection.query('SELECT description, lights_on, lights_off, temp_min, temp_max, humidity_min, humidity_max FROM plants where LOWER(species) = LOWER(?)', req.params.name, function (err, results) {
    if (err) return requestError(err, res);
    res.status(200).json({
      plants: results
    });
  });
});

app.post('/createPlant', (req, res, next) => {
  //demana json amb els 8 camps (no id)
  //també, crea el job de les alarmes
  //devuelve el id

  /* Espera:
      description: string
      species: string
      lights_on: string (time HH:MM:SS)
      lights_off: string (time HH:MM:SS)
      temp_min: float
      temp_max: float
      hum_min: float
      hum_min: float
  */

  /* Exemple de json
    {
    "description": "Ficus porta esquerra",
    "species": "Ficus",
    "lights_on": "20:30:00",
    "lights_off": "23:00:00",
    "temp_min": 25.7,
    "temp_max": 30.2,
    "hum_min": 20,
    "hum_max": 30
    }
  */

  if (typeof req.body.description === "string" && req.body.description.length <= 255 &&
    typeof req.body.species === "string" && req.body.species.length <= 255 &&
    typeof req.body.lights_on === "string" && req.body.lights_on.match(timeRegex) &&
    typeof req.body.lights_off === "string" && req.body.lights_off.match(timeRegex) && req.body.lights_off != req.body.lights_on &&
    typeof req.body.temp_min === "number" &&
    typeof req.body.temp_max === "number" && req.body.temp_min <= req.body.temp_max &&
    typeof req.body.hum_min === "number" && req.body.hum_min > 0 &&
    typeof req.body.hum_max === "number" && req.body.hum_max > 0 && req.body.hum_min <= req.body.hum_max
  ) {
    connection.query('INSERT INTO plants(description, species, lights_on, lights_off, temp_min, temp_max, humidity_min, humidity_max) VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
      [req.body.description, req.body.species, req.body.lights_on, req.body.lights_off, req.body.temp_min, req.body.temp_max, req.body.hum_min, req.body.hum_max],
      function (err, results) {
        if (err) return requestError(err, res);
        res.status(201).send();
      });
  }
  else {
    res.status(400).send("400 - Bad request");
  }
});

app.post('/modifyPlant/:id', (req, res, next) => {
  //demana json amb els 8 camps, poden ser nuls tots menys un

  let id = req.params.id;

  if (id.match(numRegex)) {
    connection.query('SELECT * FROM plants where id = ?', id, function (err, results) {
      if (err) return requestError(err, res);
      if (!results.length) {
        res.status(404).send(`404 - Plant ${id} not found`);
      }
      else {
        let changed = false;
        let parameters = [];

        if (req.body.description != null) {
          if (typeof req.body.description === "string" && req.body.description.length <= 255) {
            parameters.push(req.body.description);
            changed = true;
          }
          else {
            res.status(400).send("400 - Bad request");
            return;
          }
        }
        else {
          parameters.push(results[0]["description"]);
        }

        if (req.body.species != null) {
          if (typeof req.body.species === "string" && req.body.species.length <= 255) {
            parameters.push(req.body.species);
            changed = true;
          }
          else {
            res.status(400).send("400 - Bad request");
            return;
          }
        }
        else {
          parameters.push(results[0]["species"]);
        }

        if (req.body.lights_on != null) {
          if (typeof req.body.lights_on === "string" && req.body.lights_on.match(timeRegex)) {
            parameters.push(req.body.lights_on);
            changed = true;
          }
          else {
            res.status(400).send("400 - Bad request");
            return;
          }
        }
        else {
          parameters.push(results[0]["lights_on"]);
        }

        if (req.body.lights_off != null) {
          if (typeof req.body.lights_off === "string" && req.body.lights_off.match(timeRegex)) {
            parameters.push(req.body.lights_off);
            changed = true;
          }
          else {
            res.status(400).send("400 - Bad request");
            return;
          }
        }
        else {
          parameters.push(results[0]["lights_off"]);
        }

        if (req.body.temp_min != null) {
          if (typeof req.body.temp_min === "number") {
            parameters.push(req.body.temp_min);
            changed = true;
          }
          else {
            res.status(400).send("400 - Bad request");
            return;
          }
        }
        else {
          parameters.push(results[0]["temp_min"]);
        }

        if (req.body.temp_max != null) {
          if (typeof req.body.temp_max === "number") {
            parameters.push(req.body.temp_max);
            changed = true;
          }
          else {
            res.status(400).send("400 - Bad request");
            return;
          }
        }
        else {
          parameters.push(results[0]["temp_max"]);
        }

        if (req.body.hum_min != null) {
          if (typeof req.body.hum_min === "number" && req.body.hum_min >= 0) {
            parameters.push(req.body.hum_min);
            changed = true;
          }
          else {
            res.status(400).send("400 - Bad request");
            return;
          }
        }
        else {
          parameters.push(results[0]["humidity_min"]);
        }

        if (req.body.hum_max != null) {
          if (typeof req.body.hum_max === "number" && req.body.hum_max >= 0) {
            parameters.push(req.body.hum_max);
            changed = true;
          }
          else {
            res.status(400).send("400 - Bad request");
            return;
          }
        }
        else {
          parameters.push(results[0]["humidity_max"]);
        }
        if (changed) {
          parameters.push(id);
          connection.query(
            'UPDATE plants SET description = ?, species = ?, lights_on = ?, lights_off = ?, temp_min = ?, temp_max = ?, humidity_min = ?, humidity_max = ? WHERE id = ?',
            parameters, function (err, results) {
              if (err) return requestError(err, res);
              res.status(201).send();
            })
        }
        else {
          res.status(400).send("400 - Bad request");
          return;
        }
      }
    })
  }
  else {
    res.status(400).send("400 - Bad request");
  }
});

app.post('/deletePlant/:id', async (req, res, next) => {
  //sí
  const id = req.params.id;
  connection.query('SELECT id FROM plants WHERE id = ?;', id, async function (err, results) {
    if (err) return requestError(err, res);
    if (results.length) {
      connection.beginTransaction(async function (err) {
        if (err) return requestError(err, res);
        if (id.match(numRegex)) {
          let promises = [
            new Promise((resolve, reject) => connection.query('DELETE FROM humidityRecords WHERE plant_id = ?', id, function (err) { if (err) reject(err); else resolve() })),
            new Promise((resolve, reject) => connection.query('DELETE FROM lightRecords WHERE plant_id = ? ORDER BY timestamp DESC limit 1', id, function (err) { if (err) reject(err); else resolve() })),
            new Promise((resolve, reject) => connection.query('DELETE FROM temperatureRecords WHERE plant_id = ? ORDER BY timestamp DESC limit 1', id, function (err) { if (err) reject(err); else resolve() }))
          ];
          try {
            await Promise.all(promises);
            connection.query('DELETE FROM plants WHERE id = ?', id, function (err, results) {
              if (err) return requestError(err, res);
              connection.commit(function (error) {
                if (error) return requestError(err, res);
                res.status(201).send();
              });
            });
          }
          catch (error) {
            requestError(err, res);
          }
        }
        else {
          res.status(400).send("400 - Bad request");
        }
      })
    }
    else {
      res.status(404).send(`404 - Plant ${id} not found`);
    }
  });
});
