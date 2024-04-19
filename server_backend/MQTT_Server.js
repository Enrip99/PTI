const mqtt = require("mqtt");
const mysql = require('mysql2');

//connecta amb servidor mqtt
//const client = mqtt.connect("mqtt://localhost:8082");
const mqttUrl = "nattech.fib.upc.edu";
const mqttPort = "40412";
const client = mqtt.connect(`mqtt://${mqttUrl}:${mqttPort}`);
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
    host: "localhost",
    port: 3306,
    user: "PlantUser",
    password: "verygay",
    database: "PlantManager"
  });
  connection.connect((err) => {
    if (err) {
      console.error(`${new Date()} - Failed to connect to MySQL database.`);
      console.error(err.message);
      process.exit(1);
    };
    if (firstConnect) {
      console.log(`${new Date()} - Connected to the MySQL server at ${connection.config.user}@${connection.config.host}:${connection.config.port} using database ${connection.config.database}`);
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
      dotemperature(message.toString());
    case "humidity":
      dohumidity(message.toString());
    case "light":
      dolight(message.toString());
  }
});