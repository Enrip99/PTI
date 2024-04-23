const mqtt = require("mqtt");
const mysql = require('mysql2');

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
  switch(topic.toLowerCase()){
    case "temperature":
      doTemperature(message.toString());
    case "humidity":
      doHumidity(message.toString());
    case "light":
      doLight(message.toString());
  }
});

function doTemperature(msg){
  if(msg.match(floatRegex)){
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
   
  }
}