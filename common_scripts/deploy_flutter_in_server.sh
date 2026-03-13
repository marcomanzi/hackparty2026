#!/bin/bash

# Deploy Flutter Web App Script
# Cross-platform version (macOS + Linux)

# Cross-platform sed -i wrapper
sedi() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$@"
    else
        sed -i "$@"
    fi
}

pattern="_flutter"
for _dir in *"${pattern}"; do
    [ -d "${_dir}" ] && dir="${_dir}" && break
done

pattern="_server"
for _dir in *"${pattern}"; do
    [ -d "${_dir}" ] && server_dir="${_dir}" && break
done

cd "${dir}" || exit

# Convert Windows line endings to Unix (portable alternative to dos2unix)
# Skip if file doesn't exist or is already in Unix format
if [ -f pubspec.yaml ]; then
    # Remove carriage returns if present
    sedi 's/\r$//' pubspec.yaml 2>/dev/null || true
fi

echo "incrementing build version..."
perl -i -pe 's/^(version:\s+\d+\.\d+\.)(\d+)\+(\d+)$/$1.($2+1)."+".($3+1)/e' pubspec.yaml

rm -rf build
rm -rf ../"${server_dir}"/web/app
flutter clean
flutter pub get
if [ "$1" ]; then
  flutter build web --dart-define=build_environment=$1
else
  flutter build web --dart-define=build_environment=production
fi

# Check if build succeeded
if [ ! -d "build/web" ]; then
    echo "Error: build/web directory not found"
    exit 1
fi

# Replace base href
echo "Updating base href"
baseHref="/"
sedi "s|<base href=\"/\">|<base href=\"$baseHref\">|g" build/web/index.html

echo "Reading version from pubspec.yaml without + sign"
version=$(grep version: pubspec.yaml | sed 's/version: //g' | sed 's/+//g')

echo "Patching version in js partial urls in main.dart.js"
sedi "s/\"main.dart.js\"/\"main.dart.js?v=$version\"/g" build/web/flutter.js 2>/dev/null || true
sedi "s/\"main.dart.js\"/\"main.dart.js?v=$version\"/g" build/web/flutter_bootstrap.js 2>/dev/null || true
sedi "s/\"main.dart.js\"/\"main.dart.js?v=$version\"/g" build/web/index.html

echo "Patching assets loader with v=$version in main.dart.js"
sedi "s/self\.window\.fetch(a),/self.window.fetch(a + '?v=$version'),/g" build/web/main.dart.js 2>/dev/null || true

echo "Adding v= to manifest.json"
sedi 's/"manifest.json"/"manifest.json?v='"$version"'"/' build/web/index.html

mv build/web ../"${server_dir}"/web/app
echo "Flutter web app deployed successfully"