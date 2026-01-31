/*
  Smart Pet Feeder - Servo Test Sketch
  This code will make your MG996R motor spin back and forth.
  
  WIRING:
  - Brown Wire -> Arduino GND
  - Red Wire   -> Arduino 5V (Note: MG996R is powerful, try a phone charger if it resets)
  - Orange Wire -> Arduino Pin 9
*/

#include <Servo.h>

Servo feederServo;

void setup() {
  Serial.begin(9600);
  feederServo.attach(9); // Attach the servo on pin 9
  Serial.println("Feeder Ready. Sending test pulse...");
  
  // Initial reset to closed position
  feederServo.write(0);
  delay(1000);
}

void loop() {
  // Check if we received a command over Serial (USB)
  if (Serial.available() > 0) {
    char command = Serial.read();
    
    if (command == 'F') { // 'F' for Feed
      Serial.println("Dispensing Food...");
      
      // Swing open
      feederServo.write(90);
      delay(1000);
      
      // Swing closed
      feederServo.write(0);
      Serial.println("Feed Complete.");
    }
  }
}
