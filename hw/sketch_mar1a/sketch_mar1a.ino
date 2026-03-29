#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// Thong tin ket noi
const char* ssid = "P806";
const char* password = "12345689";
const char* mqtt_server = "192.168.1.105";
const int mqtt_port = 7997;
const char* mqtt_user = "truong";
const char* mqtt_pwd = "truong0709";

#define DEVICE1 2  // D4
#define DEVICE2 14 // D5
#define DEVICE3 15 // D8

#define DHTPIN 4   // D2
#define DHTTYPE DHT11
#define LIGHT_SENSOR A0

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);


bool isBlinking = false;
unsigned long lastBlinkTime = 0;
bool blinkState = false;

// gui trang thai
void sendFullStatus(String resultText) {
  String st1 = digitalRead(DEVICE1) ? "ON" : "OFF";
  String st2 = digitalRead(DEVICE2) ? "ON" : "OFF";
  String st3 = digitalRead(DEVICE3) ? "ON" : "OFF";

  String payload = "{\"D1\": \"" + st1 + "\", \"D2\": \"" + st2 + "\", \"D3\": \"" + st3 + "\", \"result\": \"" + resultText + "\"}";
  
  client.publish("truongguitin/callback", payload.c_str());
  Serial.println("Da gui callback: " + payload);
}

// Ham nhan va xu ly lenh
void callback(char* topic, byte* payload, unsigned long length) {
  String message;
  for (int i = 0; i < length; i++) message += (char)payload[i];

  // lap tuc tat che do nhap nhay
  if (message != "BLINK_ALL") {
    isBlinking = false;
  }

  // moi
  if (message == "ALL_ON") {
    digitalWrite(DEVICE1, HIGH);
    digitalWrite(DEVICE2, HIGH);
    digitalWrite(DEVICE3, HIGH);
    sendFullStatus("SUCCESS");
  } else if (message == "ALL_OFF") {
    digitalWrite(DEVICE1, LOW);
    digitalWrite(DEVICE2, LOW);
    digitalWrite(DEVICE3, LOW);
    sendFullStatus("SUCCESS");
  } else if (message == "BLINK_ALL") {
    isBlinking = true;
    sendFullStatus("BLINK_MODE_ON");
  } 
  
  else if (message == "D1_ON") {
    digitalWrite(DEVICE1, HIGH);
    sendFullStatus("SUCCESS");
  } else if (message == "D1_OFF") {
    digitalWrite(DEVICE1, LOW);
    sendFullStatus("SUCCESS");
  } else if (message == "D2_ON") {
    digitalWrite(DEVICE2, HIGH);
    sendFullStatus("SUCCESS");
  } else if (message == "D2_OFF") {
    digitalWrite(DEVICE2, LOW);
    sendFullStatus("SUCCESS");
  } else if (message == "D3_ON") {
    digitalWrite(DEVICE3, HIGH);
    sendFullStatus("SUCCESS");
  } else if (message == "D3_OFF") {
    digitalWrite(DEVICE3, LOW);
    sendFullStatus("SUCCESS");
  } else {
    sendFullStatus("UNKNOWN_COMMAND");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(DEVICE1, OUTPUT);
  pinMode(DEVICE2, OUTPUT);
  pinMode(DEVICE3, OUTPUT);
  dht.begin();
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nWiFi OK!");
  
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect("ESP8266_Truong", mqtt_user, mqtt_pwd)) {
      client.subscribe("truongguitin/control");
    } else {
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // nhap nhay
  if (isBlinking) {
    if (millis() - lastBlinkTime > 500) { // 0.5s
      lastBlinkTime = millis();
      blinkState = !blinkState;
      digitalWrite(DEVICE1, blinkState ? HIGH : LOW);
      digitalWrite(DEVICE2, blinkState ? HIGH : LOW);
      digitalWrite(DEVICE3, blinkState ? HIGH : LOW);
    }
  }

  // Gui du lieu cam bien moi 2 giay
  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 2000) {
    lastMsg = millis();
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int light = 1024 - analogRead(LIGHT_SENSOR);
    
    String data = "{\"T\": " + String(t) + ", \"H\": " + String(h) + ", \"L\": " + String(light) + "}";
    client.publish("truongguitin/sensors", data.c_str());
  }
}