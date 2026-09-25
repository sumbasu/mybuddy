const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// react-native-firebase pods resolve Firebase via Swift Package Manager by
// default, which collides with this project's static `use_frameworks!`
// linkage (each RNFB pod embeds its own copy of the Firebase SPM product,
// causing duplicate-symbol link errors). Setting $RNFirebaseDisableSPM
// before any target block makes react-native-firebase fall back to the
// CocoaPods-based Firebase distribution instead. The Podfile is regenerated
// on every `expo prebuild`, so this has to be injected as a mod rather than
// hand-edited.
module.exports = function withRNFirebaseDisableSPM(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');
      const marker = '$RNFirebaseDisableSPM = true';
      if (!contents.includes(marker)) {
        contents = `${marker}\n${contents}`;
        fs.writeFileSync(podfilePath, contents);
      }
      return config;
    },
  ]);
};
