const mqtt = require("mqtt");
//const client = mqtt.connect("mqtt://localhost:8082");
const client = mqtt.connect("mqtt://nattech.fib.upc.edu:40412");

client.on("connect", () => {
  client.subscribe("presence", (err) => {
    if (!err) {
      client.publish("presence", "Hello mqtt");
    }
  });
});

client.on("message", (topic, message) => {
  // message is Buffer
  console.log(message.toString());
  client.end();
});