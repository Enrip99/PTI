const mqtt = require("mqtt");
//const client = mqtt.connect("mqtt://localhost:8082");
const client = mqtt.connect("mqtt://nattech.fib.upc.edu:40412");

client.on("connect", () => {
    client.publish("temperature", "Hola chavalada que tal estais");
    client.end();
    //process.exit();
});