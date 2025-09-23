#include <WiFi.h>
#include <HTTPClient.h>
#include <ESPAsyncWebServer.h>
#include <Preferences.h>

#define LED_PIN 2
#define APPLIANCE_PIN 23 // Relay Pin
#define RESET_PIN 0

const char* apiBaseUrl = "http://10.0.48.186:3000/appliances/";

Preferences preferences;
AsyncWebServer server(80);
String applianceID;

const char* apSSID = "Ecosync Nexus Setup";
const char* apPASS = "12345678";

unsigned long previousMillis = 0;
const long blinkInterval = 500;
unsigned long buttonPressStartTime = 0;

void handleResetButton() {
  if (digitalRead(RESET_PIN) == LOW) {
    if (buttonPressStartTime == 0) {
      buttonPressStartTime = millis();
      Serial.println("Reset button pressed. Hold for 5 seconds to erase data.");
    } else if (millis() - buttonPressStartTime > 5000) {
      Serial.println("Factory reset triggered! Erasing all saved data.");
      preferences.begin("config", false);
      preferences.clear();
      preferences.end();
      digitalWrite(LED_PIN, HIGH);
      delay(1000);
      ESP.restart();
    }
  } else {
    buttonPressStartTime = 0;
  }
}

void startAPMode() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP(apSSID, apPASS);
  Serial.print("AP Mode started. Connect to WiFi: ");
  Serial.println(apSSID);

  server.onNotFound([](AsyncWebServerRequest *request){
    request->redirect("/");
  });

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    String html = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <title>Ecosync Nexus Setup</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        :root {
            --bg-color: #121212;
            --card-bg-color: #1e1e1e;
            --text-color-light: #e0e0e0;
            --text-color-muted: #888;
            --primary-blue: #007bff;
            --input-bg-color: #2b2b2b;
            --border-color: #333;
        }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            background-color: var(--bg-color); 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            margin: 0; 
            color: var(--text-color-light); 
        }
        .container { 
            background-color: var(--card-bg-color); 
            padding: 35px; 
            border-radius: 12px; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.4); 
            text-align: center; 
            max-width: 400px; 
            width: 90%; 
            box-sizing: border-box;
            margin: 20px 0; 
        }
        h1 { 
            color: var(--primary-blue); 
            margin-bottom: 25px; 
            font-size: 26px; 
            font-weight: 600;
        }
        label { 
            display: block; 
            text-align: left; 
            color: var(--text-color-light); 
            font-weight: bold; 
            margin-bottom: 5px; 
            font-size: 14px;
        }
        input[type=text], input[type=password] { 
            width: 100%; 
            padding: 14px; 
            margin-bottom: 15px;
            display: inline-block; 
            border: 1px solid var(--border-color); 
            border-radius: 6px; 
            box-sizing: border-box; 
            font-size: 16px;
            background-color: var(--input-bg-color); 
            color: var(--text-color-light); 
        }
        input[type=text]::placeholder, input[type=password]::placeholder {
            color: var(--text-color-muted); 
        }
        input[type=submit] { 
            background-color: var(--primary-blue); 
            color: white; 
            padding: 14px 20px; 
            margin: 20px 0 10px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer; 
            width: 100%; 
            font-size: 18px; 
            font-weight: bold;
            transition: background-color 0.3s ease; 
        }
        input[type=submit]:hover { 
            background-color: #0056b3; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Ecosync Nexus Device Setup</h1>
        <form action='/save' method='post'>
            <label for="ssid">WiFi Network (SSID)</label>
            <input type='text' id="ssid" name='ssid' placeholder="Enter WiFi name" required>
            <label for="pass">WiFi Password</label>
            <input type='password' id="pass" name='pass' placeholder="Enter WiFi password">
            <label for="appid">Appliance ID</label>
            <input type='text' id="appid" name='appid' placeholder="Enter unique appliance ID" required>
            <input type='submit' value='Save & Reboot'>
        </form>
    </div>
</body>
</html>
)rawliteral";
    request->send(200, "text/html", html);
  });

  server.on("/save", HTTP_POST, [](AsyncWebServerRequest *request){
    String ssid, pass, appid;
    if (request->hasParam("ssid", true)) ssid = request->getParam("ssid", true)->value();
    if (request->hasParam("pass", true)) pass = request->getParam("pass", true)->value();
    if (request->hasParam("appid", true)) appid = request->getParam("appid", true)->value();

    preferences.begin("config", false);
    preferences.putString("ssid", ssid);
    preferences.putString("pass", pass);
    preferences.putString("appid", appid);
    preferences.end();

    request->send(200, "text/html", "<h2>Saved!</h2><p>Device is rebooting...</p>");
    delay(2000);
    ESP.restart();
  });

  server.begin();
}

bool tryConnectSTA() {
  preferences.begin("config", true);
  String ssid = preferences.getString("ssid", "");
  String pass = preferences.getString("pass", "");
  applianceID = preferences.getString("appid", "");
  preferences.end();

  if (ssid == "" || applianceID == "") {
    Serial.println("No credentials or Appliance ID found.");
    return false;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());
  Serial.print("Connecting to ");
  Serial.println(ssid);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connected! IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Appliance ID: ");
    Serial.println(applianceID);
    return true;
  }

  Serial.println("Failed to connect.");
  return false;
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(APPLIANCE_PIN, OUTPUT);
  pinMode(RESET_PIN, INPUT_PULLUP);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(APPLIANCE_PIN, LOW); // CHANGE: Start with relay ON (appliance OFF)

  if (!tryConnectSTA()) {
    Serial.println("Starting AP mode for setup...");
    startAPMode();
  }
}

void loop() {
  handleResetButton();

  if (buttonPressStartTime != 0) {
    digitalWrite(LED_PIN, (millis() % 200 > 100) ? HIGH : LOW);
    return;
  }

  if (WiFi.getMode() == WIFI_AP) {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= blinkInterval) {
      previousMillis = currentMillis;
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }
  } 
  else if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String apiUrl = String(apiBaseUrl) + applianceID + "/state";
    http.begin(apiUrl);

    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      
      if (payload.indexOf("\"state\":\"on\"") != -1) {
        // De-energize relay to let current flow through NC
        digitalWrite(APPLIANCE_PIN, HIGH); // CHANGE: Turn relay OFF (appliance ON)
        digitalWrite(LED_PIN, HIGH);
      } else {
        // Energize relay to break current flow from NC
        digitalWrite(APPLIANCE_PIN, LOW);  // CHANGE: Turn relay ON (appliance OFF)
        digitalWrite(LED_PIN, LOW);
      }
    } else {
      // On error, energize relay to ensure appliance is OFF for safety
      digitalWrite(APPLIANCE_PIN, LOW); // CHANGE: Turn relay ON (appliance OFF)
      digitalWrite(LED_PIN, LOW);
    }
    http.end();
    delay(1000);
  }
  else {
      digitalWrite(LED_PIN, LOW);
  }
}