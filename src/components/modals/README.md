UpdateModal
===========

Theme-aware update prompt modal used to notify users about remote app updates.

Usage example
-------------

import UpdateModal from './modals/UpdateModal';

<UpdateModal
  visible={isVisible}
  title="New version available"
  message="We've shipped performance fixes and bugfixes."
  releaseNotes={`- Faster loading\n- Fixed avatar flicker`}
  mandatory={false}
  onUpdate={() => { /* trigger OTA update or navigation */ }}
  onClose={() => setIsVisible(false)}
/>

Design notes
------------
- Uses `src/constants/colors` and `src/constants/typography` for theme consistency.
- Keep the modal text concise; release notes can be multi-line.
