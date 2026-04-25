#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include "HX711.h"

// --- NETWORK ---
const char* ssid = "Nothing2a"; 
const char* password = "123456789";

// --- SUPABASE CONFIG ---
const char* supabaseBase = "https://tjzcpepvnebwcoqobrlt.supabase.co/rest/v1"; 
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqemNwZXB2bmVid2NvcW9icmx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njc4NzcsImV4cCI6MjA4MDM0Mzg3N30._mE8OHybd071Viw24xvUP7TNTWX1UmgkZkHN3LAvZng";
const char* myDeviceId = "bd62346a-3e65-4f8d-b7ed-cf81467d228b"; 

// --- PINS ---
const int SERVO_PIN = 18;       
const int PUMP_PIN = 23;        
const int LOADCELL_DT = 4;      
const int LOADCELL_SCK = 19;     
const int WATER_TRIG = 21;
const int WATER_ECHO = 13;
const int FOOD_TRIG = 14;   
const int FOOD_ECHO = 27;   

const float calibrationFactor = 414.0; 

Servo feederServo;
HX711 scale;
unsigned long lastSensorReport = 0;

// ULTRASONIC SENSOR LOGIC
// We use these to measure the depth of food in the hopper and water in the tank.
// Logic: Time taken for sound wave to bounce back = 2x distance.
float getDistance(int trig, int echo) {
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);
  long duration = pulseIn(echo, HIGH, 30000); // 30ms timeout to avoid "freezes"
  if (duration == 0) return 0;
  return (duration * 0.034) / 2; // Speed of sound is ~0.034 cm/us
}

// Prototypes
void updateStatus(const char* id, const char* s);
void logFeedingEvent(float grams);
void reportSensors();

void setup() {
  Serial.begin(115200);
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, HIGH);

  feederServo.attach(SERVO_PIN);
  feederServo.write(90); // Hatch Closed

  scale.begin(LOADCELL_DT, LOADCELL_SCK);
  scale.set_scale(calibrationFactor);
  
  Serial.println("\nSMART FEEDER - READY");
  delay(1000);
  scale.tare(); 

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\nSTATUS: ONLINE");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    checkCloudCommands();
    if (lastSensorReport == 0 || millis() - lastSensorReport > 60000) {
      reportSensors();
      lastSensorReport = millis();
    }
  }
}

// POLLING LOGIC
// The ESP32 asks: "Hey Supabase, is there anyone in the command_queue with status=PENDING?"
void checkCloudCommands() {
  HTTPClient http;
  String url = String(supabaseBase) + "/command_queue?status=eq.PENDING&select=*";
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);

  int httpCode = http.GET();
  if (httpCode == 200) {
    DynamicJsonDocument doc(2048);
    deserializeJson(doc, http.getString());
    JsonArray arr = doc.as<JsonArray>();

    for (JsonObject cmd : arr) {
       const char* cmdId = cmd["id"];
       const char* type = cmd["command_type"];
       
       // Handle different mission types
       if (String(type) == "FEED") {
         executeFeeding(cmdId, cmd["payload"]["grams"] | 50);
       } else if (String(type) == "WATER_FEED") {
         executeWater(cmdId, cmd["payload"]["duration"] | 3000);
       } else if (String(type) == "CALIBRATE") {
         scale.tare(); // Zero out the scale
         updateStatus(cmdId, "EXECUTED");
       }
    }
  }
  http.end();
}

// CLOSED-LOOP FEEDING MECHANISM
// This is the most complex physical logic in the project.
// It opens the hatch AND monitors the Load Cell (scale) until the weight reaches target.
void executeFeeding(const char* id, int targetGrams) {
  Serial.println("FEEDING STARTING...");
  
  // Record weight of the bowl right now (so we don't accidentally count the bowl itself as food)
  float startingWeight = abs(scale.get_units(5)); 
  Serial.print("Initial Bowl Weight: "); Serial.print(startingWeight); Serial.println("g");

  // Open the Hatch (Servo 90 -> 10 deg)
  for (int pos = 90; pos >= 10; pos--) { feederServo.write(pos); delay(15); }
  
  unsigned long startTime = millis();
  float currentTotal = 0;
  float addedWeight = 0; 
  bool success = false;
  
  // Keep feeding until target is hit or 60 seconds (safety timeout) pass
  while (millis() - startTime < 60000) {
    currentTotal = abs(scale.get_units(3)); 
    addedWeight = currentTotal - startingWeight; // Calculate ONLY the new food
    
    Serial.print("Total: "); Serial.print(currentTotal); 
    Serial.print("g (Delta: "); Serial.print(addedWeight); Serial.println("g)");

    if (addedWeight >= (float)targetGrams) { success = true; break; }
    delay(100); // Sample rate
  }

  // Close the Hatch (Servo 10 -> 90 deg)
  for (int pos = 10; pos <= 90; pos++) { feederServo.write(pos); delay(15); }
  
  // Update Backend: This closes the loop for the user's mobile app
  updateStatus(id, success ? "EXECUTED" : "FAILED");
  if (success) logFeedingEvent(addedWeight);
}

void executeWater(const char* id, int durationMs) {
  digitalWrite(PUMP_PIN, LOW);
  delay(durationMs);
  digitalWrite(PUMP_PIN, HIGH);
  updateStatus(id, "EXECUTED");
}

void updateStatus(const char* id, const char* s) {
  HTTPClient http;
  String url = String(supabaseBase) + "/command_queue?id=eq." + id;
  http.begin(url);
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Content-Type", "application/json");
  String body = "{\"status\":\"" + String(s) + "\"}";
  http.PATCH(body);
  http.end();
}

void logFeedingEvent(float grams) {
  HTTPClient http;
  http.begin(String(supabaseBase) + "/feeding_events");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Content-Type", "application/json");
  String body = "{\"device_id\":\"" + String(myDeviceId) + "\", \"amount_grams\":" + String(grams) + "}";
  http.POST(body);
  http.end();
}

void reportSensors() {
  float waterDist = getDistance(WATER_TRIG, WATER_ECHO);
  float foodDist = getDistance(FOOD_TRIG, FOOD_ECHO);
  float weight = abs(scale.get_units(5));

  int waterPct = map(constrain(waterDist, 2, 20), 2, 20, 100, 0);
  int foodPct = map(constrain(foodDist, 2, 20), 2, 20, 100, 0);

  // Send Telemetry
  Serial.println("\n--- SENDING TELEMETRY ---");
  Serial.print("Tray: "); Serial.print(weight); Serial.println("g");
  Serial.print("Water: "); Serial.print(waterPct); Serial.println("%");
  Serial.print("Food: "); Serial.print(foodPct); Serial.println("%");

  sendSensor("TRAY_WEIGHT", weight, "g");
  sendSensor("WATER_LEVEL", (float)waterPct, "%");
  sendSensor("FOOD_LEVEL", (float)foodPct, "%");
  Serial.println("STATUS REPORTED TO CLOUD");
}

void sendSensor(const char* type, float val, const char* unit) {
  HTTPClient http;
  http.begin(String(supabaseBase) + "/device_sensors");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<256> doc;
  doc["device_id"] = myDeviceId;
  doc["sensor_type"] = type;
  doc["value"] = val;
  doc["unit"] = unit; 
  
  String body;
  serializeJson(doc, body);
  http.POST(body);
  http.end();
}
