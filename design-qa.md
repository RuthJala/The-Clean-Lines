# Walkthrough correction QA — 6 September 2026

The owner's iPhone recording showed text and scroll progress advancing while the MP4 stayed on its poster. Earlier desktop checks did not establish reliability on that device.

Replaced video seeking with 662 canvas-rendered frames covering the full 33.1-second source. Desktop and mobile WebP sheets load progressively; no autoplay permission or media-ready event is needed. Removed the logo background box while retaining the supplied transparent PNG with a white treatment.

Verified in the internal Chromium preview:
- Native Page Down changed the desktop canvas from frame 0 to frame 68 at 10% scroll.
- Final chapter reached frame 661 with the final interior visible, not padded black cells.
- A 390 × 844 mobile iframe selected the mobile sequence and reached frames 264 and 661.
- Pausing at frame 661 held frame 661 while navigating back to chapter one; motion can be enabled again.
- Desktop and mobile screenshots showed the logo without a background rectangle.
- Build extracted 260 project image derivatives and 166 walkthrough sheets successfully.
- Production build and all four hosting-adapter tests passed after the build completed.

Physical iOS/Android hardware was unavailable. The mobile check covers responsive layout and sequence behavior in Chromium, not Safari hardware performance. Portrait framing crops the landscape video to cover the viewport. Original camera acceleration and motion blur remain part of the supplied render. Phone/WhatsApp details still await the owner's confirmed number.
