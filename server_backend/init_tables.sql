CREATE TABLE plants (
  id INT AUTO_INCREMENT PRIMARY KEY, 
  description VARCHAR(255) NOT NULL, 
  species VARCHAR(255) NOT NULL, 
  lights_on TIME NOT NULL, 
  lights_off TIME NOT NULL, 
  temp_min FLOAT NOT NULL, 
  temp_max FLOAT NOT NULL, 
  humidity_min FLOAT NOT NULL, 
  humidity_max FLOAT NOT NULL, 
  CHECK (temp_min < temp_max), 
  CHECK (humidity_min < humidity_max),
  CHECK (humidity_min >= 0),
  CHECK (humidity_min < 100),
  CHECK (humidity_max > 0),
  CHECK (humidity_max <= 100),
  CHECK (lights_on >= TIME '0:0:0'),
  CHECK (lights_on < TIME '24:0:0'),
  CHECK (lights_off >= TIME '0:0:0'),
  CHECK (lights_off < TIME '24:0:0'),
  CHECK (lights_off <> lights_on)
);

CREATE TABLE lightRecords (
  measure_id INT AUTO_INCREMENT PRIMARY KEY,
  plant_id INT NOT NULL,
  measure BOOLEAN NOT NULL,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (plant_id) REFERENCES plants (id)
);

CREATE TABLE temperatureRecords (
  measure_id INT AUTO_INCREMENT PRIMARY KEY,
  plant_id INT NOT NULL,
  measure FLOAT NOT NULL,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (plant_id) REFERENCES plants (id)
);

CREATE TABLE humidityRecords (
  measure_id INT AUTO_INCREMENT PRIMARY KEY,
  plant_id INT NOT NULL,
  measure FLOAT NOT NULL,
  timestamp DATETIME NOT NULL,
  FOREIGN KEY (plant_id) REFERENCES plants (id),
  CHECK (measure >= 0),
  CHECK (measure <= 100)
);
