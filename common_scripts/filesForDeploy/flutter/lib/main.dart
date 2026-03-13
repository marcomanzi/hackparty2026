const environment = String.fromEnvironment("build_environment", defaultValue: "");

var overrideUrl = "";
var serverUrls = ["https://staging/", "https://production/"];

void changeEnvironment(bool staging) {
  if (staging) {
    overrideUrl = serverUrls[0];
  } else {
    overrideUrl = serverUrls[1];
  }
}

Client get client {
  return Client(overrideUrl,
    // authenticationKeyManager: FlutterAuthenticationKeyManager(),
  )..connectivityMonitor = FlutterConnectivityMonitor();
}

Client clientWithTimeout(Duration duration) {
  return Client(overrideUrl,
      // authenticationKeyManager: FlutterAuthenticationKeyManager(),
      connectionTimeout: duration,
      streamingConnectionTimeout: duration
  )..connectivityMonitor = FlutterConnectivityMonitor();
}

void main() {
  // When you are running the app on a physical device, you need to set the
  // server URL to the IP address of your computer. You can find the IP
  // address by running `ipconfig` on Windows or `ifconfig` on Mac/Linux.
  // You can set the variable when running or building your app like this:
  // E.g. `flutter run --dart-define=SERVER_URL=https://api.example.com/`
  overrideUrl = environment == "staging" ? serverUrls[0] : environment == "production" ? serverUrls[1] : 'http://$localhost:8080/';
  runApp(const MyApp());
}