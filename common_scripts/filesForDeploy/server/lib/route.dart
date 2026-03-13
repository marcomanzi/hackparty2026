import 'dart:io';

import './route_static_directory.dart';
import 'package:serverpod/serverpod.dart';

/// Route for serving a single page app.
///
/// This route will serve the file at `web/$appRootPath` for all request that
/// do not match any other static files in the `serverDirectory`.
class RouteSinglePageApp extends RouteStaticDirectoryCustom {
  /// The path to the root file of the single page app.
  final String appRootFilePath;

  /// Creates a single page app route.
  ///
  /// The [appRootPath] is the path to the root file of the wsingle page app
  /// relative to the [serverDirectory]. Defaults to 'index.html'.
  RouteSinglePageApp({
    required super.serverDirectory,
    final appRootPath = 'index.html',
    super.basePath,
    super.serveAsRootPath,
  }) : appRootFilePath = 'web/$serverDirectory/$appRootPath';

  @override
  Future<bool> handleCall(
      final Session session, final HttpRequest request) async {
    final staticFileFound = await super.handleCall(session, request);
    if (staticFileFound) {
      return staticFileFound;
    }

    try {
      final fileContents = await File(appRootFilePath).readAsBytes();
      request.response.add(fileContents);
      return true;
    } catch (_) {}

    return false;
  }
}