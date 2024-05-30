#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// Data wire is plugged into pin 2 on the Arduino
#define ONE_WIRE_BUS 5 //2

// Setup a oneWire instance to communicate with any OneWire devices 
// (not just Maxim/Dallas temperature ICs)
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// Update these with values suitable for your network.
const char* ssid = "";
const char* password = "";
const char* mqtt_server = "nattech.fib.upc.edu"; //"192.168.1.42"
const int mqtt_port = 40412;  //1883
const char* mqtt_user = "";
const char* mqtt_pass = "";

WiFiClient espClient;
PubSubClient client(espClient);
PubSubClient client2(espClient);
long lastMsg = 0;
float temp = 0;
float humidity = 0;
float light = 0;
int inPin = 5;
int plantID = 1;
int led = 0;
String temperatureMessage;
String humidityMessage;
String ledMessage;

void setup_wifi() {
  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) 
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}
void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (client.connect("arduinoClient_temperature_sensor", mqtt_user, mqtt_pass)) {
      Serial.println("connected");
      client.subscribe("lz");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}
void callback(char* topic, byte* payload, unsigned int length) {
  char testMessage[5] = "test";
  // Función de callback para procesar mensajes MQTT recibidos
  if (topic[0] == 'l') {
    // Si el mensaje es para controlar el LED
    if (payload[0] == '1') {
      client.publish(testMessage, topic/*,TRUE*/);  
      // Encender el LED
      digitalWrite(D6, HIGH);
      led = 1;
    } else {
      // Apagar el LED
      digitalWrite(D6, LOW);
      led = 0;
    }
  }
}
 
void setup()
{
  Serial.begin(115200);
  pinMode(inPin, INPUT);
  pinMode(D1, INPUT);       //he añadido esto pero creo que no hace falta
  //pinMode(A0, INPUT);
  pinMode(D6 , OUTPUT);
  pinMode(D4 , OUTPUT);
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  setup_wifi(); 
  sensors.begin();
}

void loop()
{
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 3000) {
    lastMsg = now;
    sensors.setResolution(12);
    sensors.requestTemperatures(); // Send the command to get temperatures
    temp = sensors.getTempCByIndex(0);
    humidity = analogRead(A0);
    light = digitalRead(D5); // Poner el pin que toque!!
    //temp = digitalRead(D1);
    humidity = map(humidity, 0, 8, 0, 100); //12 -> 13 o +
    //humidity = (1000-humidity)/10;
    Serial.println(temp);
    Serial.println(humidity);
    //Serial.println(humidity);

    //if((temp > -20) && (temp <60) && (humidity > 0)) 
    temperatureMessage = String(plantID) + " " + String(temp, 2);
    client.publish("temperature", temperatureMessage.c_str()/*,TRUE*/); 
    
    //if (humidity >= 0) 
    humidityMessage = String(plantID) + " " + String(humidity);
    client.publish("humidity", humidityMessage.c_str()/*,TRUE*/);

    if (light == LOW) {
      digitalWrite(D4, LOW);
      //String lightMessage = String(plantID) + " true";
      //client.publish("light", lightMessage.c_str()/*,TRUE*/);
    }
    else {
      digitalWrite(D4, HIGH);
      //String lightMessage = String(plantID) + " false";
      //client.publish("light", lightMessage.c_str()/*,TRUE*/);
    }
    ledMessage = String(plantID) + " " + String(led);
    client.publish("led", ledMessage.c_str()/*,TRUE*/);
    /*if(client2.subscribe("light")) digitalWrite(D7, HIGH);
    else digitalWrite(D7, LOW);*/
  }
}