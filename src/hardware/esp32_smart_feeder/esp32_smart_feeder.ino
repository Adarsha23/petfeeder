#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include "HX711.h"

// --- 📡 NETWORK SETTINGS ---
const char* ssid = "Nothing2a"; 
const char* password = "123456789";

// --- ☁️ SUPABASE SETTINGS ---
const char* supabaseBase = "https://tjzcpepvnebwcoqobrlt.supabase.co/rest/v1"; 
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqemNwZXB2bmVid2NvcW9icmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc4NzcsImV4cCI6MjA4MDM0Mzg3N30._mE8OHybd071Viw24xvUP7TNTWX1UmgkZkHN3LAvZng";

// --- ⚙️ DEVICE IDENTITY ---
const char* myDeviceId = "bd62346a-3e65-4f8d-b7ed-cf81467d228b"; 

// --- 🔌 PIN DEFINITIONS ---
const int SERVO_PIN = 18;       // Motor Signal
const int FOOD_TRIG = 19;       // Food Ultrasonic (Trig)
const int FOOD_ECHO = 12;       // Food Ultrasonic (Echo)
const int WATER_TRIG = 21;      // Water Ultrasonic (Trig)
const int WATER_ECHO = 13;      // Water Ultrasonic (Echo)
const int LOADCELL_DT = 4;      // Scale Data
const int LOADCELL_SCK = 5;     // Scale Clock

// --- GLOBAL OBJECTS ---
Servo feederServo;
HX711 scale;
unsigned long lastSensorReport = 0;

// --- FUNCTION PROTOTYPES (To prevent scope errors) ---
void updateStatus(const char* id, const char* s, float actualGrams);
void executeFeeding(const char* id, int grams);
void executeWater(const char* id, int ms);
void postToCloud(const char* type, float val);
void reportHeartbeat();

void setup() {
  Serial.begin(115200);
  
  // Initialize Ultrasonic Pins
  pinMode(FOOD_TRIG, OUTPUT);
  pinMode(FOOD_ECHO, INPUT);
  pinMode(WATER_TRIG, OUTPUT);
  pinMode(WATER_ECHO, INPUT);
  
  // Initialize Servo
  feederServo.attach(SERVO_PIN);
  feederServo.write(90); // CENTER / NEUTRAL POSITION 

  // Initialize Scale
  scale.begin(LOADCELL_DT, LOADCELL_SCK);
  scale.set_scale(420.0); // Calibration Factor
  scale.tare();

  // Connect to WiFi
  Serial.print("--- SYSTEM STARTING ---\nConnecting WiFi: ");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Online! Running system checks...");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // 1. Check for commands from website
    checkCloudCommands();
    
    // 2. Report Sensors to Cloud (every 60s)
    if (millis() - lastSensorReport > 60000) {
      reportSensors();
      reportHeartbeat(); // Updates last_seen_at in DB
      lastSensorReport = millis();
    }
  } else {
    Serial.println("WiFi Link Down. Retrying...");
    WiFi.begin(ssid, password);
  }
  delay(3000); 
}

// --- ULTRASONIC LOGIC ---
float getDistance(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long duration = pulseIn(echo, HIGH, 30000);
  return (duration * 0.034) / 2;
}

void reportSensors() {
  // 1. Measure Everything
  float fDist = getDistance(FOOD_TRIG, FOOD_ECHO);
  float wDist = getDistance(WATER_TRIG, WATER_ECHO);
  float weight = scale.get_units(5);

  // 2. Calculate Percentages (assuming 20cm deep containers)
  int fPct = map(constrain(fDist, 3, 20), 3, 20, 100, 0);
  int wPct = map(constrain(wDist, 3, 20), 3, 20, 100, 0);

  // 3. 🖥️ PRINT TO SERIAL MONITOR
  Serial.println("\n--- 📊 SENSOR REPORT ---");
  Serial.print("🍗 Food: "); Serial.print(fPct); Serial.println("%");
  Serial.print("💧 Water: "); Serial.print(wPct); Serial.println("%");
  Serial.print("⚖️ Weight on Tray: "); Serial.print(weight); Serial.println("g");
  Serial.println("-----------------------");

  // 4. Send to Cloud (Database)
  postToCloud("FOOD_LEVEL", fPct);
  postToCloud("WATER_LEVEL", wPct);
  postToCloud("TRAY_WEIGHT", weight);
}

void checkCloudCommands() {
  HTTPClient http;
  String url = String(supabaseBase) + "/command_queue?status=eq.PENDING&select=*";
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);

  if (http.GET() == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, payload);
    JsonArray arr = doc.as<JsonArray>();

    for (JsonObject cmd : arr) {
       const char* cmdId = cmd["id"];
       const char* type = cmd["command_type"];
       
       if (String(type) == "FEED") {
         int g = cmd["payload"]["grams"]; if(g<=0) g=50;
         Serial.println("🚀 DISPENSING FOOD...");
         executeFeeding(cmdId, g);
       } else if (String(type) == "WATER_FEED") {
         int ms = cmd["payload"]["duration"]; if(ms<=0) ms=3000;
         Serial.println("🌊 DISPENSING WATER...");
         executeWater(cmdId, ms);
       } else if (String(type) == "CALIBRATE") {
         Serial.println("⚖️ TARE COMMAND RECEIVED!");
         scale.tare();
         updateStatus(cmdId, "EXECUTED", 0);
       }
    }
  }
  http.end();
}

void executeFeeding(const char* id, int targetGrams) {
  Serial.print("⚖️ Target: "); Serial.print(targetGrams); Serial.println("g. Taring Scale...");
  scale.tare();
  delay(300);

  // 1. Rotate to Food Hatch (Counter-Clockwise)
  Serial.println("📂 Food Hatch Opening...");
  for (int pos = 90; pos >= 20; pos--) { feederServo.write(pos); delay(8); }

  // 2. Closed-Loop Monitoring
  unsigned long startFeed = millis();
  float currentWeight = 0;
  while (currentWeight < targetGrams) {
    currentWeight = scale.get_units(3);
    if (millis() - startFeed > 15000) break; // 15s Timeout
    delay(50); 
  }

  // 3. Return to Neutral
  Serial.println("🔒 Closing Hatch...");
  for (int pos = 20; pos <= 90; pos++) { feederServo.write(pos); delay(8); }

  float finalGrams = scale.get_units(10);
  updateStatus(id, "EXECUTED", finalGrams);
  Serial.print("✅ Food Complete: "); Serial.print(finalGrams); Serial.println("g");
}

void executeWater(const char* id, int durationMs) {
  // 1. Rotate to Water Hatch (Clockwise)
  Serial.println("🌊 Water Hatch Opening...");
  for (int pos = 90; pos <= 160; pos++) { feederServo.write(pos); delay(8); }

  // 2. Wait for duration
  delay(durationMs);

  // 3. Return to Neutral
  Serial.println("🔒 Closing Hatch...");
  for (int pos = 160; pos >= 90; pos--) { feederServo.write(pos); delay(8); }

  updateStatus(id, "EXECUTED", 1.0); 
  Serial.println("✅ Water Complete.");
}

void postToCloud(const char* type, float val) {
  HTTPClient http;
  http.begin(String(supabaseBase) + "/device_sensors");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Content-Type", "application/json");

  String json = "{\"device_id\":\"" + String(myDeviceId) + "\", \"sensor_type\":\"" + String(type) + "\", \"value\":" + String(val) + ", \"unit\":\"%\"}";
  int code = http.POST(json);
  
  if (code != 201) {
    Serial.print("POST "); Serial.print(type); Serial.print(" FAILED: "); Serial.println(code);
  }
  http.end();
}

void updateStatus(const char* id, const char* s, float actualGrams) {
  HTTPClient http;
  String url = String(supabaseBase) + "/command_queue?id=eq." + id;
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Content-Type", "application/json");

  String json = "{\"status\":\"" + String(s) + "\", \"actual_grams\":" + String(actualGrams) + "}";
  int code = http.PATCH(json);
  Serial.print("Update Command Status: "); Serial.println(code);
  http.end();
}

void reportHeartbeat() {
  HTTPClient http;
  String url = String(supabaseBase) + "/devices?id=eq." + String(myDeviceId);
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");
  
  int code = http.PATCH("{\"status\":\"ONLINE\", \"last_seen_at\":\"now()\"}");
  if (code < 0) {
    Serial.print("Heartbeat Failed: "); Serial.println(http.errorToString(code).c_str());
  }
  http.end();
}
