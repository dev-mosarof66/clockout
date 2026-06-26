const { withAndroidManifest } = require('@expo/config-plugins');

// Some transitive Android dependency declares ARCore as REQUIRED, which blocks
// installing on devices without "Google Play Services for AR". Clockout doesn't
// use AR, so force it optional in the merged manifest.
module.exports = function withArOptional(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Ensure the tools namespace exists (needed for tools:replace).
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    // 1) uses-feature: any AR camera feature → required="false".
    manifest['uses-feature'] = manifest['uses-feature'] || [];
    const arFeatures = ['android.hardware.camera.ar', 'com.google.ar.core'];
    for (const name of arFeatures) {
      let feat = manifest['uses-feature'].find((f) => f.$ && f.$['android:name'] === name);
      if (!feat) {
        feat = { $: { 'android:name': name } };
        manifest['uses-feature'].push(feat);
      }
      feat.$['android:required'] = 'false';
      feat.$['tools:replace'] = 'android:required';
    }

    // 2) meta-data com.google.ar.core → "optional".
    const app = manifest.application && manifest.application[0];
    if (app) {
      app['meta-data'] = app['meta-data'] || [];
      let md = app['meta-data'].find((m) => m.$ && m.$['android:name'] === 'com.google.ar.core');
      if (!md) {
        md = { $: { 'android:name': 'com.google.ar.core' } };
        app['meta-data'].push(md);
      }
      md.$['android:value'] = 'optional';
      md.$['tools:replace'] = 'android:value';
    }

    return cfg;
  });
};
