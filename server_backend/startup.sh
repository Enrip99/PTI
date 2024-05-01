#!/bin/bash

node MQTT_Server.js &> MQTT.log &
node API_REST.js &> API.log &