# React Native Yatzy Game (Android)

## Description

Welcome to the **React Native Yatzy Game!**  
This mobile application is a digital version of the classic dice game Yatzy, built using React Native to provide a seamless experience.

**Note:** This repository does not include the `assets/` folder (images, sounds, etc.) for copyright and privacy reasons. The codebase is intended for code review and demonstration purposes only. If you wish to play the game, you can download it from the Google Play Store (see link below).


## Features

- **Classic Yatzy Gameplay:** Experience the traditional Yatzy game with all standard rules and scoring.
- **Fully Responsive Gameboard:** Complete support for both tablets and phones. Footer dice size is now adjustable for optimal experience on all devices.
- **Score Sharing:** Share your achievements with friends! Generate a branded score image and share it directly from the game via WhatsApp, Messages, or other apps.
- **New Score Modal:** Redesigned score modal for improved clarity and usability.
- **New Avatars & Elite Background:** Unlock new avatars and a special elite background for top players.
- **Sound Effects:** Immersive sound effects added throughout the game.
- **Refactored Codebase:** The entire project structure has been refactored for maintainability and performance.
- **Credits Section:** Added a credits section to the About Me page.
- **Unified Bonus Logic:** Bonus logic in ScoreModal and Scoreboard is now consistent and reliable.
- **UI/UX Improvements:** Modernized look, improved dice/footer layout, and overall smoother user experience.
- **Energy Token System:** Tokens regenerate automatically, even when the app is closed.
- **Firebase Integration:** Manage and track your high scores using Firebase.
- **Account Linking:** Securely link your account with email and password for cloud saves and device sync.

## Folder Structure

```
/ (root)
  |-- App.js
  |-- package.json
  |-- ...
  |-- src/
      |-- components/
      |-- screens/
      |-- services/
      |-- constants/
      |-- styles/
```

- All business logic and UI code is under `src/`.
- The `assets/` folder is excluded from the repository.

## Download and Install

The game is available on Google Play! Download the latest version directly from the Google Play Store.

**Download Link:** [Google Play Store](https://play.google.com/store/apps/details?id=com.SimpleYatzee)

## For Recruiters

This repository is intended for code review and demonstration purposes. The codebase is clean, modular, and well-commented in English. If you wish to see the app in action, please download it from the Play Store (link above).

## Usage

After launching the game, you'll be greeted with a simple menu where you can start a new game, view high scores, or read the game rules. Tap 'Start Game' to begin your Yatzy adventure!

## Changelog

### Version 3.0.7
- **Score Sharing:** Added share functionality in the score modal. Players can now share their achievements with friends via a branded image that includes player name, total score, and download link to Google Play.
- **Score Validation Improvements:** Fixed duplicate validation warnings that could occur when returning from share dialog.
- **Modal State Persistence:** Improved score modal state management to prevent premature closure during share operations.
- **UI Polish:** Optimized share button layout and visual consistency across the score modal interface.

### Version 3.0.0 (September 2025)
- **Fully Responsive Gameboard:** Complete support for tablets and phones, with adjustable footer dice size.
- **New Score Modal:** Redesigned for clarity and ease of use.
- **New Avatars & Elite Background:** Unlockable avatars and a special elite background for top players.
- **Sound Effects:** Added immersive sound effects throughout the game.
- **Major Refactor:** The entire codebase has been refactored for better maintainability and performance.
- **Credits Section:** Added to the About Me page.
- **Unified Bonus Logic:** Bonus logic in ScoreModal and Scoreboard is now consistent.
- **UI/UX Improvements:** Modernized look, improved dice/footer layout, and smoother user experience.
- **Energy Token System:** Tokens regenerate automatically, even when the app is closed.
- **Bug Fixes:** Fixed issues with energy tokens and modal logic.

### Version 2.2.2 (August 2025)
- **Ads Removed:** All advertisements have been removed for a cleaner experience.
- **Edge-to-Edge Support:** Full edge-to-edge screen support for modern devices.
- **Animated Landing Page:** Added a new animated landing/start page for improved first impression.
- **Asset Preloading:** All assets are now preloaded for smoother and faster gameplay.
- **Firebase Remote Config:** Integrated Firebase Remote Config for dynamic updates and feature toggling.
- **Image Optimization:** All images and assets have been optimized for performance and size.
- **UI Improvements:** General UI/UX improvements for a more polished look and feel.
- **Bug Fixes:** Minor bug fixes (very few issues reported).

### Version 2.0.0 (Stable Release)
- **Official Release:** The stable version of the game is now officially launched.
- **Avatar Customization:** European country flags have been added to the avatar selection.

### Version 1.2.4
- **Account Linking:** Added the ability to link your account with an email and password. This ensures that your game data is securely stored in the cloud, allowing you to access your progress from any device. Unlinked accounts store progress locally, which may risk data loss if your device is lost or damaged.

### Version 1.2.0 - Yazee For Testers
- **Added About Me Page:** New 'About Me' page with details about the project and the developer.
- **Implemented Swipe Navigation:** Users can now navigate between screens using swipe gestures for enhanced experience.
- **Player Top 5 Scores:** Added functionality to view the player's top 5 scores in a detailed modal.
- **Updated Header Button Design:** Fixed positioning and styling issues with the header button.
- **Modal Integration:** Replaced alert notifications with modals for a more modern UI.
- **UI/UX Improvements:** Minor styling adjustments for a cleaner interface.
- **Monthly Best Players:** Added a feature to view the best players for each month.
- **PlayerCard with Trophies:** Display player's top scores along with a trophy case showing monthly rankings.

### Version 1.1.1
- **Improved Player Recognition:** Switched to **Expo Secure Store** for better user data handling and security.
- **Added Dice Animation:** Enhanced visual experience with animations for dice rolls.
- **UI/UX Improvements:** Minor adjustments for smoother user interface.
- **Bug Fixes:** Corrected logic for bonus points to ensure accurate score calculation.

### Version 1.1.0
- Integrated **Firebase** for high score management and storage.
- Enhanced **User Device Recognition** for improved login experience.
- Improved **UI Design** for a more intuitive user experience.
- Minor bug fixes and performance optimizations.

### Version 1.0.0
- Initial release with core Yatzy gameplay.
- Basic UI play capability.
- Local high score tracking.


## Feedback

Your feedback is invaluable! If you have suggestions, ideas, or encounter any issues, please let me know. Join the discussion in the [Discussions](https://github.com/Sabata79/RN_Yatzee_FULL-GAME/discussions/1) section of this repository.

## License

This project is licensed under the MIT License – see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- **React Native Community** for continuous support and resources.
- All contributors and supporters of this project.
