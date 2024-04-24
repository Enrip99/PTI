const mqtt = require("mqtt");
const schedule = require('node-schedule');
//const client = mqtt.connect("mqtt://localhost:8082");
const client = mqtt.connect("mqtt://nattech.fib.upc.edu:40412");

client.on("connect", () => {
    const job = schedule.scheduleJob('*/30 * * * * *', function(fireDate){
      client.publish("notification", "Prova de notificació a les" + fireDate );
    });
    //client.end();
    client.subscribe("notification", (err) => {
      if (err) {
        console.error(err);
        process.exit(3);
      }
    });
});

client.on("message", (topic, message) => {
  // message is Buffer
  console.log(topic, message.toString());
});