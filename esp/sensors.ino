#include <OneWire.h>
#include <DallasTemperature.h>

OneWire oneWire(D1);

DallasTemperature sensors(&oneWire);

void setup() {
  Serial.begin(9600);
  sensors.begin();
  sensors.setResolution(11);
}

void loop() {
  sensors.requestTemperatures(); 
  float temperatureA = sensors.getTempCByIndex(0);
  delay(25);
  float temperatureB = sensors.getTempCByIndex(1);
  float temperatureC = (temperatureA + temperatureB) / 2;
  Serial.print("mean: ");
  Serial.print(temperatureC);
  Serial.println("ºC");
  delay(4975);
}
