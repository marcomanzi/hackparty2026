// This file is copied from the Serverpod package to set a shorter client
// side cache time. Setting the cache time is a feature supported in Serverpod
// on main, but that has not yet been released.
// Delete this file when Serverpod 2.4 is released!
import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:serverpod/serverpod.dart';

final _contentTypeMapping = <String, ContentType>{
  '.js': ContentType('text', 'javascript'),
  '.json': ContentType('application', 'json'),
  '.wsam': ContentType('application', 'wasm'),
  '.css': ContentType('text', 'css'),
  '.png': ContentType('image', 'png'),
  '.jpg': ContentType('image', 'jpeg'),
  '.jpeg': ContentType('image', 'jpeg'),
  '.svg': ContentType('image', 'svg+xml'),
  '.ttf': ContentType('application', 'x-font-ttf'),
  '.woff': ContentType('application', 'x-font-woff'),
  '.mp3': ContentType('audio', 'mpeg'),
  '.pdf': ContentType('application', 'pdf'),
};

/// Route for serving a directory of static files.
class RouteStaticDirectoryCustom extends Route {
  /// The path to the directory to serve relative to the web/ directory.
  final String serverDirectory;

  /// The path to the directory to serve static files from.
  final String? basePath;

  /// The path to serve as the root path ('/'), e.g. '/index.html'.
  final String? serveAsRootPath;

  /// Creates a static directory with the [serverDirectory] as its root.
  RouteStaticDirectoryCustom({
    required this.serverDirectory,
    this.basePath,
    this.serveAsRootPath,
  });

  @override
  Future<bool> handleCall(
      final Session session, final HttpRequest request) async {
    var path = Uri.decodeFull(request.requestedUri.path);

    final rootPath = serveAsRootPath;
    if (rootPath != null && path == '/') {
      path = rootPath;
    }

    try {
      // Remove version control string
      final dir = serverDirectory;
      var base = p.basenameWithoutExtension(path);
      var extension = p.extension(path);

      final baseParts = base.split('@');
      if (baseParts.last.startsWith('v')) {
        if (baseParts.length > 1 && baseParts.last.startsWith('v')) {
          baseParts.removeLast();
        }
      }
      base = baseParts.join('@');

      final localBasePath = basePath;
      if (localBasePath != null && path.startsWith(localBasePath)) {
        final requestDir = p.dirname(path);
        final middlePath = requestDir.substring(localBasePath.length);

        if (middlePath.isNotEmpty) {
          path = p.join(dir, middlePath, base + extension);
        } else {
          path = p.join(dir, base + extension);
        }
      } else {
        path = p.join(dir, base + extension);
      }

      // Set content type.
      extension = extension.toLowerCase();
      final contentType = _contentTypeMapping[extension];
      if (contentType != null) {
        request.response.headers.contentType = contentType;
      }

      // Set cache to 24 hours.
      // request.response.headers.set('Cache-Control', 'max-age=${24 * 60 * 60}');
      // Set Cache to 1 minute
      request.response.headers.set('Cache-Control', 'max-age=${60}');

      var filePath = path.startsWith('/') ? path.substring(1) : path;
      filePath = 'web/$filePath';

      final fileContents = await File(filePath).readAsBytes();

      request.response.add(fileContents);
      return true;
    } catch (e) {
      // Couldn't find or load file.
      return false;
    }
  }
}