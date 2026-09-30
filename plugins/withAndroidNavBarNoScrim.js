const { withAndroidStyles } = require('@expo/config-plugins');

// Expo's Android template sets android:enforceNavigationBarContrast="true" in
// styles.xml, which makes the OS draw its own translucent scrim behind the
// 3-button/gesture nav bar for legibility. With edgeToEdgeEnabled (app.json),
// that scrim sits on top of our own tab bar background, producing a visible
// two-tone band at the very bottom of the screen instead of one solid color.
// styles.xml is regenerated on every `expo prebuild`, so this has to be
// injected as a mod rather than hand-edited.
module.exports = function withAndroidNavBarNoScrim(config) {
  return withAndroidStyles(config, (config) => {
    const appTheme = config.modResults.resources.style?.find(
      (style) => style.$.name === 'AppTheme'
    );
    if (appTheme) {
      const item = appTheme.item?.find(
        (i) => i.$.name === 'android:enforceNavigationBarContrast'
      );
      if (item) {
        item._ = 'false';
      }
    }
    return config;
  });
};
