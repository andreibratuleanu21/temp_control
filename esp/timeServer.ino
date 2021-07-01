//#include <LiquidCrystal_I2C.h>
#include <TinyGPS++.h>
#include <ESP8266WiFi.h>
#include <SoftwareSerial.h>
#include <WiFiUdp.h>

TinyGPSPlus gps;
WiFiUDP Udp;
SoftwareSerial gs(D3, D4);
//LiquidCrystal_I2C lcd(0x27, 16, 2);

bool connected = false;
u16 yearNum = 0;
u8 monNum = 0;
u8 dayNum = 0;
u8 hrNum = 0;
u8 minNum = 0;
u8 secNum = 0;
char dateTimeStr[21];
char incomingPacket[5];

const char* ssid = "***";
const char* password = "***";

void setup(){
  Serial.begin(9600);
  delay(10);
  Serial.println('\n');

  //lcd.init();
  //lcd.backlight();
  //lcd.setCursor(0, 0);
  //lcd.print("Init...");
  
  WiFi.begin(ssid, password);
  Serial.println("Connecting to wifi");

  int i = 0;
  while (WiFi.status() != WL_CONNECTED && i < 3) {
    delay(2000);
    Serial.print(++i); Serial.print('.');
  }

  connected = WiFi.status() == WL_CONNECTED;

  gs.begin(9600);
  delay(10);
  gs.write("GGA");
  Udp.begin(443);
  Serial.printf("Now listening at IP %s", WiFi.localIP().toString().c_str());
  Serial.println("Init DONE!");
  //lcd.clear();
  //lcd.setCursor(0,0);
  //lcd.print("Init DONE");
  delay(1000);
  //lcd.clear();
}

void loop(){
  if (gs.available() > 0) {
    byte gpsData = gs.read();
    gps.encode(gpsData);
    if (gps.time.isUpdated()) {
      yearNum = gps.date.year();
      monNum = gps.date.month();
      dayNum = gps.date.day();
      hrNum = gps.time.hour() + 3;
      minNum = gps.time.minute();
      secNum = gps.time.second();
      sprintf(dateTimeStr, "%04d:%02d:%02d:%02d:%02d:%02d", yearNum, monNum, dayNum, hrNum, minNum, secNum);
      //char dateStr[11];
      //sprintf(dateStr, "%04d:%02d:%02d", yearNum, monNum, dayNum);
      //char timeStr[9];
      //sprintf(timeStr, "%02d:%02d:%02d", hrNum, minNum, secNum);
      //Serial.println(dateStr);
      //lcd.setCursor(0,0);
      //lcd.print(String(dateStr));
      //lcd.setCursor(0,1);
      //lcd.print(String(timeStr));
    }
  }
  int packetSize = Udp.parsePacket();
  if (packetSize) {
    Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
    Udp.write(dateTimeStr);
    Udp.endPacket();
  }
  if (!connected) {
    delay(100);
    ESP.restart();
  }
}
