# QR Studio

A free, dark-mode QR code generator built with React, Vite and Tailwind CSS.

## Features

- Generate static QR codes for URLs, email, phone and SMS links.
- Live preview with custom foreground/background colors.
- PNG export (including uploaded center logo) and SVG vector export.
- Output size, margin and error-correction controls.
- Save up to 20 recent links in browser local storage.
- No account, backend, API key or paid QR service required.

## Requirements

- Node.js 20.19+ or 22.12+ recommended.
- npm.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

The production files are generated in `dist/`.

## Free deployment

### Vercel
1. Push this project to a GitHub repository.
2. Import the repository in Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy.

### Netlify
1. Import the GitHub repository.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Deploy.

## Notes

- QR codes are static: they encode the destination provided at generation time. Changing the destination later requires generating a new QR code.
- The history is stored only in the current browser using `localStorage`; it does not sync between devices.
- The PNG preview includes the optional logo. SVG export currently exports the QR pattern without embedding the uploaded logo.
- Test each QR code with more than one phone/camera before printing, especially when using custom colors or a center logo.
