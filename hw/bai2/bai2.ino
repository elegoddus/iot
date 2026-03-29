#include "DHT.h"

// Cau hinh chan cho DHT11
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define LED1 2
#define LED2 14
#define LED3 15

#define LIGHT_SENSOR A0

bool ledState = LOW;

void setup() {
  // Khoi tao cong Ser
  Serial.begin(115200);
  
  // DHT
  dht.begin();
  
  // Dat cac chan LED lam dau ra
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);
  
  Serial.println("Bat dau chuong trinh...");
}

void loop() {
  
  digitalWrite(LED1, HIGH);
  digitalWrite(LED2, LOW);
  digitalWrite(LED3, LOW);
  delay(500); 

  
  digitalWrite(LED1, LOW);
  digitalWrite(LED2, HIGH);
  digitalWrite(LED3, LOW);
  delay(500);

  
  digitalWrite(LED1, LOW);
  digitalWrite(LED2, LOW);
  digitalWrite(LED3, HIGH);
  delay(500);

  
  digitalWrite(LED3, LOW);

  // Doc du lieu DHT
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Doc du lieu cam bien anh sang
  int lightValue = 1024 - analogRead(LIGHT_SENSOR);

  // Hien thi du lieu
  if (isnan(h) || isnan(t)) {
    Serial.print("Loi: Khong the doc du lieu");
  } else {
    Serial.print("Nhiet do: ");
    Serial.print(t);
    Serial.print(" *C\t");
    
    Serial.print("Do am: ");
    Serial.print(h);
    Serial.print(" %\t");
  }

  Serial.print("Anh sang (A0): ");
  Serial.println(lightValue);

  // 2s
  delay(2000);
}