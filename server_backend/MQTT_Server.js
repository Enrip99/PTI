const mqtt = require("mqtt");
const mysql = require('mysql2');

const timeRegex = /^(?:[01]?[0-9]|2[0-3])(?::[0-5]?[0-9]){2}$/
const floatRegex = /^-?(?:(?:[0-9]*\.[0-9]+)|(?:[0-9]+\.?))$/

//connecta amb servidor mqtt
const client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_HOST}`);
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

client.on("message", (topic, message) => {
  // message is Buffer
  switch (topic.toLowerCase()) {
    case "temperature":
      doTemperature(message.toString());
    case "humidity":
      doHumidity(message.toString());
    case "light":
      doLight(message.toString());
  }
});

function mqttError(error) {
  console.error(error);
}

function doTemperature(msg) {
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
  if (!msg.match(floatRegex)) return;

  let id = 1;
  connection.query('SELECT temp_min, temp_max FROM plants WHERE id = ?', id, function (err, results) {
    if (err) return mqttError(err);
    if (!results[0].length) return;
    if (parseFloat(results[0].temp_min) > parseFloat(msg)){
      client.publish("notification", `Temperatura massa baixa per a planta ${id}: ${msg} graus.` );
    }
    else if (parseFloat(results[0].temp_max) < parseFloat(msg)){
      client.publish("notification", `Temperatura massa alta per a planta ${id}: ${msg} graus.` );
    }
    connection.query('INSERT INTO temperatureRecords(plant_id, measure, timestamp) VALUES (?, ?, NOW())', [id, msg], function (err) {
      if (err) return mqttError(err);
    })
  })
}

function doHumidity(msg) {
  if (!msg.match(floatRegex)) return;

  let id = 1;
  connection.query('SELECT humidity_min, humidity_max FROM plants WHERE id = ?', id, function (err, results) {
    if (err) return mqttError(err);
    if (!results[0].length) return;
    if (parseFloat(results[0].humidity_min) > parseFloat(msg)){
      client.publish("notification", `Humitat massa baixa per a planta ${id}: ${msg}%.` );
    }
    else if (parseFloat(results[0].humidity_max) < parseFloat(msg)){
      client.publish("notification", `Humitat massa alta per a planta ${id}: ${msg}%.` );
    }
    connection.query('INSERT INTO humidityRecords(plant_id, measure, timestamp) VALUES (?, ?, NOW())', [id, msg], function (err) {
      if (err) return mqttError(err);
    })
  })
}

function doLight(msg) {
  if (!msg.match(timeRegex)) return;
  return;
  //lmao i'm not parsing times at 2 am
  let id = 1;
  connection.query('SELECT lights_on, lights_off FROM plants WHERE id = ?', id, function (err, results) {
    if (err) return mqttError(err);
    if (!results[0].length) return;
    if (parseFloat(results[0].lights_on) > parseFloat(msg)){
      client.publish("notification", `Humitat massa baixa per a planta ${id}: ${msg}%.` );
    }
    else if (parseFloat(results[0].lights_off) < parseFloat(msg)){
      client.publish("notification", `Humitat massa alta per a planta ${id}: ${msg}%.` );
    }
    connection.query('INSERT INTO lightRecords(plant_id, measure, timestamp) VALUES (?, ?, NOW())', [id, msg], function (err) {
      if (err) return mqttError(err);
    })
  })
}