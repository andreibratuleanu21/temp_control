#include <TimeLib.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>

OneWire oneWire(D3);
LiquidCrystal_I2C lcd(0x27, 16, 2);
DallasTemperature sensors(&oneWire);
WiFiUDP Udp;

const char* ssid = "DIGI-382E";
const char* password = "9Djrb373";
const char date_sep[2] = ":";
const int off_pin = D5;
const int on_pin = D6;
const int fan_pin = D7;
const int pwr_pin = D8;
const String hw_states[3] = {"OFF ", "AUTO", "ON  "};
const String pwr_states[3] = {"OPRIT ", "PAUZA ", "PORNIT"};

int hw_mode = 0;
float telementry[16];
int t_index = 0;
int err = 0;
int sts = 0;
float min_temp = 2.7;
float max_temp = 5.1;
float avg = 0.0;
int work_time = 60 * 60 * 3;
int pause_time = 60 * 60 * 1;
int start_time = 0;
int stop_time = 0;

void setup() {
  Serial.begin(9600);
  pinMode(off_pin, INPUT_PULLUP);
  pinMode(on_pin, INPUT_PULLUP);
  pinMode(fan_pin, OUTPUT);
  pinMode(pwr_pin, OUTPUT);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("INITIALIZARE...");

  sensors.begin();
  sensors.setResolution(11);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to wifi");
  int i = 0;
  while (WiFi.status() != WL_CONNECTED && i < 5) {
    delay(3000);
    Serial.print(".");
  }
  Serial.println(".");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(WiFi.localIP());
    Udp.begin(443);
  } else {
    err = 1;
    Serial.println("NOT Connected");
  }
  delay(20);
  Udp.beginPacket("192.168.100.18", 7777);
  char lineBuff[2];
  lineBuff[0] = 1;
  lineBuff[1] = 0;
  Udp.write(lineBuff);
  Udp.endPacket();
  Udp.beginPacket("192.168.100.200", 443);
  Udp.write(lineBuff);
  Udp.endPacket();
  lcd.clear();
}

void loop() {
  sensors.requestTemperatures();
  delay(10);
  float temperatureA = sensors.getTempCByIndex(0);
  float temperatureC = 0.0;
  bool aIsOk = true;
  bool bIsOk = true;
  if (temperatureA < -40 || temperatureA > 60) {
    aIsOk = false;
    err = 2;
  }
  delay(10);
  float temperatureB = sensors.getTempCByIndex(1);
  if (temperatureB < -40 || temperatureB > 60) {
    bIsOk = false;
    err = 3;
  }
  if (aIsOk && bIsOk) {
    temperatureC = (temperatureA + temperatureB) / 2;
  } else if (aIsOk) {
    temperatureC = temperatureA;
  } else {
    temperatureC = temperatureB;
  }
  int off_pin_state = digitalRead(off_pin);
  int on_pin_state = digitalRead(on_pin);
  if (off_pin_state == LOW) {
    hw_mode = 0;
  } else if (on_pin_state == LOW) {
    hw_mode = 2;
  } else {
    hw_mode = 1;
  }
  if (hw_mode == 0) {
    start_time = 0;
    stop_time = 0;
    sts = 0;
    digitalWrite(pwr_pin, LOW);
    digitalWrite(fan_pin, LOW);
  } else {
    digitalWrite(fan_pin, HIGH);
    telementry[t_index] = temperatureC;
    if (t_index >= 16) {
      t_index = 0;
      avg = 0.0;
      for (int i=0; i<10; i++) {
        avg = (avg + telementry[i])/2;
      }
      if (sts == 0) {
        sts = 1;
      }
      if (sts == 1 && stop_time == 0 && avg > max_temp) {
        digitalWrite(pwr_pin, HIGH);
        sts = 2;
        start_time = now();
        stop_time = 0;
      }
      if (sts == 2 && avg < min_temp) {
        digitalWrite(pwr_pin, LOW);
        start_time = 0;
        stop_time = 0;
        sts = 1;
      }
      int timestamp = now();
      if (sts == 2 && start_time != 0 && (timestamp - start_time) > work_time) {
        start_time = 0;
        stop_time = timestamp;
        digitalWrite(pwr_pin, LOW);
        sts = 1;
      }
      if (sts == 1 && stop_time != 0 && (timestamp - stop_time) > pause_time) {
        stop_time = 0;
        start_time = timestamp;
        digitalWrite(pwr_pin, HIGH);
        sts = 2;
      }
      Udp.beginPacket("192.168.100.18", 7777);
      char lineBuff[16];
      sprintf(lineBuff, " %02d%02d%02d%02d%02d%.2f%d%d", month(), day(), hour(), minute(), second(), avg, sts, hw_mode);
      lineBuff[0] = 4;
      Udp.write(lineBuff);
      Udp.endPacket();
    } else {
      t_index = t_index + 1;
    }
  }
  char lineBuff[16];
  sprintf(lineBuff, "%.2f%cC E%02d %s", temperatureC, 223, err, hw_states[hw_mode]);
  lcd.setCursor(0, 0);
  lcd.print(lineBuff);
  sprintf(lineBuff, "%02d:%02d:%02d  %s", hour(), minute(), second(), pwr_states[sts]);
  lcd.setCursor(0, 1);
  lcd.print(lineBuff);
  int packetSize = Udp.parsePacket();
  if (packetSize) {
    if(Udp.remoteIP()[0] == 192 && Udp.remoteIP()[3] == 200) {
      char data[packetSize + 1];
      Udp.read(data, packetSize);
      data[packetSize] = 0;
      char *le_yer = strtok(data, date_sep);
      char *le_mon = strtok(NULL, date_sep);
      char *le_day = strtok(NULL, date_sep);
      char *le_hor = strtok(NULL, date_sep);
      char *le_min = strtok(NULL, date_sep);
      char *le_sec = strtok(NULL, date_sep);
      int il_yer = atoi(le_yer);
      int il_mon = atoi(le_mon);
      int il_day = atoi(le_day);
      int il_hor = atoi(le_hor);
      int il_min = atoi(le_min);
      int il_sec = atoi(le_sec);
      setTime(il_hor,il_min,il_sec + 1,il_day,il_mon,il_yer);
    } else if (hw_mode == 1 && packetSize > 12) {
      char data[packetSize + 1];
      Udp.read(data, packetSize);
      data[packetSize] = 0;
      char *min_temp_str = strtok(data, date_sep);
      char *max_temp_str = strtok(NULL, date_sep);
      char *work_time_str = strtok(NULL, date_sep);
      char *pause_time_str = strtok(NULL, date_sep);
      min_temp = atof(min_temp_str);
      max_temp = atof(max_temp_str);
      work_time = atoi(work_time_str);
      pause_time = atoi(pause_time_str);
      char displayy[32];
      sprintf(displayy, "%f, %f, %d, %d", min_temp, max_temp, work_time, pause_time);
      Serial.println(displayy);
    }
  }
}
