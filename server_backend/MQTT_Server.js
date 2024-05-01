require('dotenv').config()
const mqtt = require("mqtt");
const mysql = require('mysql2');

const floatRegex = /^-?(?:(?:[0-9]*\.[0-9]+)|(?:[0-9]+\.?))$/


//connecta amb servidor mqtt
const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`);
client.on("connect", () => {
  client.subscribe("temperature", (err) => {
    if (err) {
      console.error(err);
      process.exit(3);
    }
  });
  client.subscribe("light", (err) => {
    if (err) {
      console.error(err);
      process.exit(3);
    }
  });
  client.subscribe("humidity", (err) => {
    if (err) {
      console.error(err);
      process.exit(3);
    }
  });
});

//connecta amb base de dades
var firstConnect = true;
const connectToDatabase = async () => {
  connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
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

client.on("message", (topic, message) => {
  // message is Buffer, we have to use toString
  // we then split into plant id and rest of message
  let stringMsg = message.toString();
  let index = stringMsg.indexOf(' ');
  let id = stringMsg.slice(0, index);
  let msg = stringMsg.slice(index + 1);

  switch (topic.toLowerCase()) {
    case "temperature":
      doTemperature(id, msg);
      break;
    case "humidity":
      doHumidity(id, msg);
      break;
    case "light":
      doLight(id, msg);
      break;
  }
});

function mqttError(error) {
  console.error(error);
}

/*
Steps:
1- check if input is acceptable (already done)
 - cancel if invalid
2- check if plant exists (we skip it in this phase bc we only support one plant)
 - This allows us to also gather plant facts
 - cancel if not an existing plant
3- add input to database
4- if value out of range, notification error
*/

function doTemperature(id, msg) {

  let measure = msg;
  if (!measure.match(floatRegex)) return;

  connection.query('SELECT temp_min, temp_max FROM plants WHERE id = ?', id, function (err, results) {
    if (err) return mqttError(err);
    if (!results.length) return;

    if (parseFloat(results[0].temp_min) > parseFloat(measure)) {
      client.publish("notification", `Temperatura massa baixa per a planta ${id}: ${measure} graus.`);
    }
    else if (parseFloat(results[0].temp_max) < parseFloat(measure)) {
      client.publish("notification", `Temperatura massa alta per a planta ${id}: ${measure} graus.`);
    }
    connection.query('INSERT INTO temperatureRecords(plant_id, measure, timestamp) VALUES (?, ?, NOW())', [id, measure], function (err) {
      if (err) return mqttError(err);
    })
  })
}

function doHumidity(id, msg) {

  let measure = msg;
  if (!measure.match(floatRegex)) return;
  connection.query('SELECT humidity_min, humidity_max FROM plants WHERE id = ?', id, function (err, results) {
    if (err) return mqttError(err);
    if (!results.length) return;

    if (parseFloat(results[0].humidity_min) > parseFloat(measure)) {
      client.publish("notification", `Humitat massa baixa per a planta ${id}: ${measure}%.`);
    }
    else if (parseFloat(results[0].humidity_max) < parseFloat(measure)) {
      client.publish("notification", `Humitat massa alta per a planta ${id}: ${measure}%.`);
    }
    connection.query('INSERT INTO humidityRecords(plant_id, measure, timestamp) VALUES (?, ?, NOW())', [id, measure], function (err) {
      if (err) return mqttError(err);
    })
  })
}

function doLight(id, msg) {
  let measure;
  if (msg === "true") measure = true;
  else if (msg === "false") measure = false;
  else return;
  let horaActual = new Date().toTimeString().split(' ')[0];

  connection.query('SELECT lights_on, lights_off FROM plants WHERE id = ?', id, function (err, results) {
    if (err) return mqttError(err);
    if (!results.length) return;
    
    connection.query('INSERT INTO lightRecords(plant_id, measure, timestamp) VALUES (?, ?, NOW())', [id, measure], function (err) {
      if (err) return mqttError(err);
      if (measure && ((results[0].lights_on < results[0].lights_off && (horaActual < results[0].lights_on || results[0].lights_off < horaActual)) || (results[0].lights_off < results[0].lights_on && results[0].lights_off < horaActual && horaActual < results[0].lights_on))) {
        client.publish("notification", `Les llums de la planta ${id} són enceses fora d'hora.`);
      }
      else if (!measure && ((results[0].lights_on < results[0].lights_off && results[0].lights_on < horaActual && horaActual < results[0].lights_off) || (results[0].lights_off < results[0].lights_on && (horaActual < results[0].lights_off || results[0].lights_on < horaActual)))) {
        client.publish("notification", `Les llums de la planta ${id} són apagades fora d'hora.`);
      }
    })
  })
}