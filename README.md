# The Clean Lines

Interior design website with a complete 33.1-second scroll-driven villa walkthrough, seven project volumes, 130 project images, original logo, services, studio and contact pages.

- `npm install` then `npm run dev` for local development.
- `npm run build` creates the portable static site in `dist/client`.
- `npm run test:sites` validates the included hosting adapter.
- Upload the contents of `dist/client` to Hostinger when ready. Relative assets and hash routes work in subdirectories. No Hostinger deployment has been performed.

Video uses browser-native H.264 MP4 with short keyframe intervals, separate mobile/desktop sources, a poster, native scrolling, six text chapters, direct chapter navigation, motion pause and reduced-motion preference support. The full source timeline is mapped to the scroll distance. On narrow screens the video fills the viewport with side cropping.

Enquiries are prepared locally and opened in the visitor's email app. No backend, automatic sending or fake submission confirmation. Email: thecleanlines27@gmail.com. Instagram: @thecleanlines_. Add phone/WhatsApp only after the owner confirms the current number.

Project titles use the supplied volume labels because client names, locations and execution status have not been confirmed. Original source files remain in the owner's Drive. This repository includes optimized WebP derivatives and web video encodes.

The 130 optimized project images (260 full-size and thumbnail files) are stored in `media/projects.tar.gz.part1` and `.part2`. `npm install`, `npm run dev` and `npm run build` automatically unpack them into `public/assets/projects` using the included Node script. The resulting static deployment contains ordinary WebP files and requires no server-side extraction. The archive keeps the complete collection together for reliable transfer.
