# The Clean Lines

Interior design website with a complete 33.1-second scroll-driven villa walkthrough, seven project volumes, 130 project images, original logo, services, studio and contact pages.

- `npm install` then `npm run dev` for local development.
- `npm run build` creates the portable static site in `dist/client`.
- `npm run test:sites` validates the included hosting adapter.
- Upload the contents of `dist/client` to Hostinger when ready. Relative assets and hash routes work in subdirectories. No Hostinger deployment has been performed.

The walkthrough uses a canvas image sequence covering the full 33.1-second timeline (662 frames at 20 fps). Scroll position controls the displayed frame directly, without video autoplay or MP4 seeking. Separate desktop/mobile WebP sheets load progressively with three concurrent requests and at most five cached sheets. Six text chapters, chapter jumps, pause and reduced-motion support remain. Portrait screens crop the sides to fill the viewport.

The four `media/walkthrough.tar.gz.part00`–`part03` files unpack automatically during install/dev/build into 166 ordinary WebP sheets. The last frame is 661; padded cells in the final sheet are never displayed. The original transparent PNG logo is displayed with a white treatment and no background box.

Enquiries are prepared locally and opened in the visitor's email app. No backend, automatic sending or fake submission confirmation. Email: thecleanlines27@gmail.com. Instagram: @thecleanlines_. Add phone/WhatsApp only after the owner confirms the current number.

Project titles use the supplied volume labels because client names, locations and execution status have not been confirmed. Original source files remain in the owner's Drive. This repository includes optimized WebP derivatives and web video encodes.

The 130 optimized project images (260 full-size and thumbnail files) are stored in `media/projects.tar.gz.part1` and `.part2`. `npm install`, `npm run dev` and `npm run build` automatically unpack them into `public/assets/projects` using the included Node script. The resulting static deployment contains ordinary WebP files and requires no server-side extraction. The archive keeps the complete collection together for reliable transfer.
