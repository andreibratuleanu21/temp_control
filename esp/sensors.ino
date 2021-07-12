#include <TimeLib.h>
#include <LiquidCrystal_I2C.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>

OneWire oneWire(D3);
LiquidCrystal_I2C lcd(0x27);
DallasTemperature sensors(&oneWire);
WiFiUDP Udp;

const char* ssid = "***";
const char* password = "***";
const char* srv_addr = "*.*.*.*";
const char date_sep[2] = ":";
const int off_pin = D5;
const int on_pin = D6;
const int fan_pin = D7;
const int pwr_pin = D8;
const char* hw_states[3] = {"OFF ", "AUTO", "ON  "};
const char* pwr_states[3] = {"OPRIT ", "PAUZA ", "PORNIT"};

int hw_mode = 0;
int err = 0;
int sts = 0;
float min_temp = 2.5;
float max_temp = 5.0;
int work_time = 60 * 60 * 3;
int pause_time = 60 * 60 * 1;
int start_time = 0;
int stop_time = 0;
int sync_time = 0;

void setup() {
  pinMode(off_pin, INPUT_PULLUP);
  pinMode(on_pin, INPUT_PULLUP);
  pinMode(fan_pin, OUTPUT);
  pinMode(pwr_pin, OUTPUT);

  lcd.begin(16, 2);
  lcd.setBacklight(HIGH);
  lcd.setCursor(0, 0);
  lcd.print("INITIALIZARE...");

  sensors.begin();
  sensors.setResolution(11);

  WiFi.begin(ssid, password);
  int i = 0;
  while (WiFi.status() != WL_CONNECTED && i < 5) {
    delay(3000);
  }
  if (WiFi.status() == WL_CONNECTED) {
    Udp.begin(443);
  } else {
    err = 1;
  }
  lcd.clear();
  delay(20);
}

void loop() {

  //GET temp
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

  //GET sw status
  int off_pin_state = digitalRead(off_pin);
  int on_pin_state = digitalRead(on_pin);
  if (off_pin_state == LOW) {
    if (hw_mode != 0) {
      start_time = 0;
      stop_time = 0;
      sts = 0;
      digitalWrite(pwr_pin, LOW);
      digitalWrite(fan_pin, LOW);
    }
    hw_mode = 0;
  } else if (on_pin_state == LOW) {
    if (hw_mode != 2) {
      start_time = 0;
      stop_time = 0;
      digitalWrite(fan_pin, HIGH);
    }
    hw_mode = 2;
  } else {
    if (hw_mode != 1) {
      start_time = 0;
      stop_time = 0;
      digitalWrite(fan_pin, HIGH);
    }
    hw_mode = 1;
  }

  int time_now = now();

  //Control logic
  if(hw_mode == 0) {
    sts = 0;
  } else {
    if (sts == 1 && stop_time == 0 && temperatureC > max_temp + 0.1) {
      digitalWrite(pwr_pin, HIGH);
      sts = 2;
      start_time = time_now;
      stop_time = 0;
    }
    if (sts == 2 && temperatureC < min_temp - 0.1) {
      digitalWrite(pwr_pin, LOW);
      sts = 1;
      start_time = 0;
      stop_time = 0;
    }
    if (sts == 1 && stop_time != 0 && (time_now - stop_time) > pause_time) {
      digitalWrite(pwr_pin, HIGH);
      sts = 2;
      start_time = time_now;
      stop_time = 0;
    }
    if (sts == 2 && start_time != 0 && (time_now - start_time) > work_time) {
      digitalWrite(pwr_pin, LOW);
      sts = 1;
      start_time = 0;
      stop_time = time_now;
    }
  }

  //Display data
  char lineBuff[16];
  sprintf(lineBuff, "%.2f%cC E%02d %s", temperatureC, 223, err, hw_states[hw_mode]);
  lcd.setCursor(0, 0);
  lcd.print(lineBuff);
  sprintf(lineBuff, "%02d:%02d:%02d  %s", hour(), minute(), second(), pwr_states[sts]);
  lcd.setCursor(0, 1);
  lcd.print(lineBuff);

  //Decide to sync
  if (time_now - sync_time > 300) {
    sync_time = time_now;
    Udp.beginPacket(srv_addr, 7777);
    char lineBuff[32];
    sprintf(lineBuff, " %02d%02d%02d%02d%02d%.2f%d%d", month(), day(), hour(), minute(), second(), temperatureC, sts, hw_mode);
    lineBuff[0] = 4;
    Udp.write(lineBuff);
    Udp.endPacket();
    Udp.beginPacket("192.168.100.200", 443);
    Udp.write(lineBuff);
    Udp.endPacket();
  }

  //Receive UDP packets
  int packetSize = Udp.parsePacket();
  if (packetSize) {
    if(Udp.remoteIP()[0] == 192 && Udp.remoteIP()[1] == 168 && Udp.remoteIP()[2] == 100 && Udp.remoteIP()[3] == 200) {
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
    } else if (hw_mode == 1 && packetSize > 12 && Udp.remoteIP()[0] == 0 && Udp.remoteIP()[1] == 0 && Udp.remoteIP()[2] == 0 && Udp.remoteIP()[3] == 0) {
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
    }
  }
}
