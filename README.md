# Chromatic — Palette Studio

Generator palet warna interaktif dengan layout **bento grid**. Kunci warna yang kamu suka, generate sisanya, lalu atur tiap shade lewat slider HSL. Sepasang mata di tile preview mengikuti kursor dan berubah warna sesuai swatch yang dipilih.

Berawal dari desain komunitas Figma [Interactive Eye-Following Card](https://www.figma.com/design/EKGQfBKBWTNjvVvW6cUkeB/Interactive-Eye-Following-Card--Community-), lalu didesain ulang.

## Fitur

- **Generate palet** dengan 4 aturan harmoni: Analogous, Complementary, Triadic, Monochrome
- **Lock warna**: warna yang dikunci tidak berubah saat generate
- **Slider Hue / Saturation / Lightness** dengan track gradient yang mengikuti warna aktif
- **Mata interaktif** yang mengikuti kursor (dan sentuhan di perangkat touch)
- **Copy hex** dengan sekali klik, plus nama warna untuk tiap swatch
- **Preview kartu** (modal) untuk warna yang dipilih
- **Export CSS**: unduh `palette.css` berisi CSS variables (`--color-1` sampai `--color-5`)
- Responsif: 12 kolom di desktop, 2 kolom di mobile
- Bisa dipakai dengan keyboard (Enter / Space untuk memilih swatch)

## Tech stack

| Bagian | Pakai |
| --- | --- |
| Framework | React 18 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animasi | Motion (`motion/react`) |
| Font | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (Google Fonts, CDN) |
| Ikon | [Phosphor Icons](https://phosphoricons.com) (CDN) |

Font dan ikon dimuat lewat CDN di `index.html`, jadi butuh koneksi internet untuk tampil. Kalau ikon tidak muncul, cek akses ke `fonts.googleapis.com` dan `cdn.jsdelivr.net`.

## Menjalankan di lokal

Prasyarat: **Node.js 18+** dan **pnpm** (`npm install -g pnpm`).

```bash
pnpm install
pnpm dev
```

Buka `http://localhost:5173`.

### Perintah lain

```bash
pnpm build                # build produksi ke folder dist/
pnpm exec vite preview    # lihat hasil build secara lokal
```

Pakai npm juga bisa: `npm install` lalu `npm run dev`.

## Deploy ke EdgeOne

```bash
pnpm install
edgeone makers deploy
```

Kalau CLI belum terpasang: `npm install -g edgeone`.

## Struktur proyek

```
├── index.html                  # entry HTML, memuat font & ikon dari CDN
├── vite.config.ts
├── tsconfig.json
├── pnpm-workspace.yaml         # izin build script pnpm (esbuild, tailwind oxide)
└── src
    ├── main.tsx
    ├── app
    │   ├── App.tsx             # seluruh layout bento + logika palet
    │   └── components
    │       ├── Eye.tsx         # satu mata + pergerakan pupil
    │       ├── EyePair.tsx     # sepasang mata, auto-scale mengikuti lebar tile
    │       ├── Icon.tsx        # wrapper kecil untuk ikon Phosphor
    │       └── ui/             # komponen shadcn bawaan template (tidak dipakai App)
    └── styles
        ├── index.css           # entry CSS
        ├── theme.css           # design tokens + style slider
        └── fonts.css           # font-family dasar
```

## Kustomisasi cepat

- **Palet awal**: ubah `initialPalette` di `src/app/App.tsx`
- **Aturan harmoni**: ubah `harmonies` (daftar chip) dan `offsets` di `makePalette`
- **Susunan bento**: ubah array `slots` (swatch) dan class `lg:col-[...] lg:row-[...]` di tiap tile. Grid desktop-nya 12 kolom dengan tinggi baris 112px
- **Warna tema**: ubah variabel di `src/styles/theme.css` (`--background`, `--foreground`, `--primary`, `--accent`)

## Troubleshooting

**`'vite' is not recognized`**: dependency belum terpasang. Jalankan `pnpm install` dulu.

**`ERR_PNPM_IGNORED_BUILDS`**: pnpm 10+ memblokir script build secara default. Izinnya sudah ada di `pnpm-workspace.yaml`. Kalau masih muncul, jalankan `pnpm approve-builds`.

**`failed to import ... node_modules`** (Windows): biasanya path terlalu panjang atau diblokir antivirus. Pindahkan proyek ke path pendek (mis. `C:\p\palette`) atau aktifkan Windows Long Paths.

**`vite.config.ts` merah di VS Code**: pastikan `@types/node` terpasang, lalu `Ctrl+Shift+P` → *TypeScript: Restart TS Server*.

## Lisensi & atribusi

Desain asli dari komunitas Figma (lihat tautan di atas). Detail atribusi aset ada di `ATTRIBUTIONS.md`.
