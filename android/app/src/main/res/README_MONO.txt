Monochrome icon set for Android 13+.

Copy these into: android/app/src/main/res/

Files:
- mipmap-*/ic_launcher_monochrome.png
- mipmap-anydpi-v26/ic_launcher.xml  (references @mipmap/ic_launcher_monochrome)

If you're using the previous package I sent, keep its foreground assets and colors.xml.
This package only adds the monochrome PNGs and updates ic_launcher.xml to point to them.

Commands:
  cd android && gradlew clean
  Remove the app from the device (to clear launcher cache)
  Reinstall / EAS build

Tip: On Android 13+, system themes will tint the monochrome to match Material You.