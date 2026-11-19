import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { EyePair } from "./components/EyePair";
import { Icon } from "./components/Icon";

type Swatch = {
  hex: string;
  locked: boolean;
};

const harmonies = [
  { name: "Analogous", icon: "gradient" },
  { name: "Complementary", icon: "circle-half" },
  { name: "Triadic", icon: "triangle" },
  { name: "Monochrome", icon: "circle" },
];

// Bento placement for the five swatches (12-col grid, 112px rows on desktop)
const slots = [
  { area: "col-span-2 min-h-[190px] lg:col-[1/4] lg:row-[4/7]", wide: false, big: true },
  { area: "min-h-[170px] lg:col-[4/7] lg:row-[4/6]", wide: false, big: false },
  { area: "min-h-[170px] lg:col-[7/9] lg:row-[4/6]", wide: false, big: false },
  { area: "min-h-[104px] lg:col-[4/6] lg:row-[6/7]", wide: true, big: false },
  { area: "min-h-[104px] lg:col-[6/9] lg:row-[6/7]", wide: true, big: false },
];

const tile = "relative overflow-hidden rounded-[28px]";
const cardTile = `${tile} border border-foreground/10 bg-card p-5 md:p-6`;


const initialPalette: Swatch[] = [
  { hex: "#F6EBD8", locked: false },
  { hex: "#FF5C35", locked: false },
  { hex: "#D4F23A", locked: true },
  { hex: "#4935D4", locked: false },
  { hex: "#17151C", locked: false },
];

function hslToHex(h: number, s: number, l: number) {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  let [r, g, b] = [0, 0, 0];

  if (h < 60) [r, g] = [chroma, x];
  else if (h < 120) [r, g] = [x, chroma];
  else if (h < 180) [g, b] = [chroma, x];
  else if (h < 240) [g, b] = [x, chroma];
  else if (h < 300) [r, b] = [x, chroma];
  else [r, b] = [chroma, x];

  return `#${[r, g, b]
    .map((value) => Math.round((value + m) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function hexToHsl(hex: string) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function isDark(hex: string) {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function getColorName(hex: string) {
  const { h, s, l } = hexToHsl(hex);
  if (l >= 90) return "Paper Cloud";
  if (l <= 20) return "Midnight Ink";
  if (s <= 18) return l > 55 ? "Soft Pebble" : "Graphite Dust";
  if (h < 18 || h >= 345) return l > 65 ? "Blush Parade" : "Tomato Beat";
  if (h < 48) return l > 65 ? "Apricot Cream" : "Tangerine Pop";
  if (h < 72) return "Golden Static";
  if (h < 105) return "Electric Lime";
  if (h < 160) return "Garden Pulse";
  if (h < 195) return "Poolside Mint";
  if (h < 230) return "Cookie Blue";
  if (h < 265) return "Cosmic Violet";
  if (h < 305) return "Velvet Orbit";
  return "Berry Disco";
}

function makePalette(harmony: string, current: Swatch[]) {
  const base = Math.floor(Math.random() * 360);
  const offsets: Record<string, number[]> = {
    Analogous: [-48, -20, 0, 24, 52],
    Complementary: [0, 28, 180, 204, 332],
    Triadic: [0, 120, 240, 24, 144],
    Monochrome: [0, 0, 0, 0, 0],
  };
  const lightness = harmony === "Monochrome" ? [92, 74, 55, 35, 15] : [90, 66, 52, 38, 18];
  return current.map((swatch, index) => ({
    ...swatch,
    hex: swatch.locked
      ? swatch.hex
      : hslToHex((base + offsets[harmony][index] + 360) % 360, index === 0 ? 38 : 78, lightness[index]),
  }));
}

export default function App() {
  const [palette, setPalette] = useState(initialPalette);
  const [harmony, setHarmony] = useState("Analogous");
  const [selected, setSelected] = useState(2);
  const [showEyePreview, setShowEyePreview] = useState(false);
  const [notice, setNotice] = useState("");
  const activeHsl = useMemo(() => hexToHsl(palette[selected].hex), [palette, selected]);
  const activeHex = palette[selected].hex;

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const generate = () => setPalette((colors) => makePalette(harmony, colors));

  const copyColor = async (hex: string) => {
    try {
      await navigator.clipboard?.writeText(hex);
    } catch {
      /* clipboard can be blocked in iframes */
    }
    setNotice(`${hex} copied`);
  };

  const updateActive = (key: "h" | "s" | "l", value: number) => {
    const next = { ...activeHsl, [key]: value };
    setPalette((colors) =>
      colors.map((color, index) => (index === selected ? { ...color, hex: hslToHex(next.h, next.s, next.l) } : color)),
    );
  };

  const toggleLock = (index: number) =>
    setPalette((colors) => colors.map((color, i) => (i === index ? { ...color, locked: !color.locked } : color)));

  const exportPalette = () => {
    const content = `:root {\n${palette.map((color, index) => `  --color-${index + 1}: ${color.hex};`).join("\n")}\n}`;
    const blob = new Blob([content], { type: "text/css" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = "palette.css";
    anchor.click();
    URL.revokeObjectURL(href);
    setNotice("CSS palette exported");
  };

  const sliders = [
    {
      key: "h" as const,
      label: "Hue",
      value: activeHsl.h,
      max: 360,
      unit: "°",
      track: "linear-gradient(90deg,hsl(0 85% 55%),hsl(60 85% 55%),hsl(120 85% 55%),hsl(180 85% 55%),hsl(240 85% 55%),hsl(300 85% 55%),hsl(360 85% 55%))",
    },
    {
      key: "s" as const,
      label: "Saturation",
      value: activeHsl.s,
      max: 100,
      unit: "%",
      track: `linear-gradient(90deg,hsl(${activeHsl.h} 0% ${activeHsl.l}%),hsl(${activeHsl.h} 100% ${activeHsl.l}%))`,
    },
    {
      key: "l" as const,
      label: "Lightness",
      value: activeHsl.l,
      max: 100,
      unit: "%",
      track: `linear-gradient(90deg,#000,hsl(${activeHsl.h} ${activeHsl.s}% 50%),#fff)`,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <div className="mx-auto max-w-[1280px] px-4 pb-10 md:px-8">
        {/* Header */}
        <header className="flex items-center justify-between py-5">
          <a href="#" className="flex items-center gap-3" aria-label="Chromatic home">
            <img src="/logo.png" alt="Chromatic logo" className="size-10 rounded-2xl object-cover" />
            <span className="text-xl font-extrabold tracking-[-0.04em]">Chromatic</span>
          </a>
          <span className="hidden items-center gap-2 rounded-full border border-foreground/15 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground sm:flex">
            <Icon name="paint-brush-broad" weight="bold" className="text-sm" />
            Palette studio
          </span>
        </header>

        {/* Bento grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:auto-rows-[112px] lg:grid-cols-12">
          {/* Hero */}
          <section className={`${tile} col-span-2 flex min-h-[340px] flex-col justify-between bg-foreground p-6 text-background md:p-8 lg:col-[1/9] lg:row-[1/4]`}>
            <div className="flex items-start justify-between gap-4">
              <span className="flex items-center gap-2 rounded-full bg-background/10 px-3.5 py-1.5 text-xs font-semibold">
                <Icon name="sparkle" weight="fill" className="text-sm text-accent" />
                Color playground · No. 04
              </span>
              <div className="flex -space-x-2" aria-hidden="true">
                {palette.map((swatch, index) => (
                  <span
                    key={index}
                    className="size-8 rounded-full border-[3px] border-foreground transition-colors duration-300"
                    style={{ backgroundColor: swatch.hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <h1 className="text-[clamp(2.6rem,5.4vw,4.9rem)] font-extrabold leading-[0.98] tracking-[-0.045em]">
                Find your
                <br />
                <span className="text-accent">color rhythm.</span>
              </h1>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-xs text-sm font-medium leading-relaxed text-background/60">
                  Lock the colors you love, then tune every shade by hand.
                </p>
                <button
                  onClick={generate}
                  className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition hover:brightness-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Icon name="sparkle" weight="fill" className="text-base" />
                  Generate
                </button>
              </div>
            </div>
          </section>

          {/* Eyes */}
          <section
            aria-label="Eye preview"
            className={`${tile} col-span-2 flex min-h-[440px] flex-col justify-between p-4 transition-colors duration-300 lg:col-[9/13] lg:row-[1/6]`}
            style={{ backgroundColor: activeHex }}
          >
            <div className="flex items-start justify-between">
              <span className="flex items-center gap-2 rounded-full bg-[#fbf0dc] px-3.5 py-2 text-[11px] font-bold text-[#17151c]">
                <span className="size-2 animate-pulse rounded-full bg-[#ff5c35]" />
                Eyes follow your cursor
              </span>
            </div>

            <div className="px-2">
              <EyePair />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-[20px] bg-[#fbf0dc] p-4 text-[#17151c]">
              <div className="min-w-0">
                <p className="tabular text-3xl font-extrabold leading-none tracking-[-0.04em]">{activeHex}</p>
                <p className="mt-1.5 truncate text-sm font-semibold text-[#17151c]/65">{getColorName(activeHex)}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => copyColor(activeHex)}
                  className="grid size-11 place-items-center rounded-full bg-[#17151c]/8 transition hover:bg-[#17151c] hover:text-[#fbf0dc]"
                  aria-label="Copy color"
                >
                  <Icon name="copy" className="text-lg" />
                </button>
                <button
                  onClick={() => setShowEyePreview(true)}
                  className="grid size-11 place-items-center rounded-full bg-[#17151c] text-[#fbf0dc] transition hover:scale-105"
                  aria-label="Open card preview"
                >
                  <Icon name="arrows-out-simple" className="text-lg" />
                </button>
              </div>
            </div>
          </section>

          {/* Swatches */}
          {palette.map((swatch, index) => {
            const dark = isDark(swatch.hex);
            const slot = slots[index];
            const isSelected = selected === index;
            const ink = dark ? "text-white" : "text-[#17151c]";
            const chip = dark ? "bg-white/15 hover:bg-white/30" : "bg-black/10 hover:bg-black/20";
            const select = () => setSelected(index);
            const onKey = (event: KeyboardEvent) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                select();
              }
            };

            const indexPill = (
              <span className={`tabular flex h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold ${chip}`}>
                {isSelected ? (
                  <>
                    <Icon name="pencil-simple" weight="fill" className="text-xs" />
                    Editing
                  </>
                ) : (
                  `0${index + 1}`
                )}
              </span>
            );

            const lockButton = (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  toggleLock(index);
                }}
                className={`grid size-9 shrink-0 place-items-center rounded-full transition active:scale-90 ${
                  swatch.locked ? (dark ? "bg-white text-[#17151c]" : "bg-[#17151c] text-white") : chip
                }`}
                aria-label={swatch.locked ? "Unlock color" : "Lock color"}
                aria-pressed={swatch.locked}
              >
                <Icon name={swatch.locked ? "lock-simple" : "lock-simple-open"} weight={swatch.locked ? "fill" : "bold"} className="text-base" />
              </button>
            );

            const hexButton = (size: string) => (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  copyColor(swatch.hex);
                }}
                className={`tabular group/hex flex items-center gap-2 font-extrabold tracking-[-0.03em] ${size}`}
                aria-label={`Copy ${swatch.hex}`}
              >
                {swatch.hex}
                <Icon name="copy" className="text-base opacity-0 transition group-hover/hex:opacity-70 group-focus-visible/hex:opacity-70" />
              </button>
            );

            return (
              <article
                key={index}
                role="button"
                tabIndex={0}
                onClick={select}
                onKeyDown={onKey}
                aria-label={`Select color ${swatch.hex}`}
                aria-pressed={isSelected}
                className={`${tile} ${slot.area} ${ink} border border-foreground/10 cursor-pointer transition-[background-color,box-shadow] duration-300 focus-visible:outline-none ${
                  isSelected ? "ring-[3px] ring-foreground ring-offset-[3px] ring-offset-background" : "hover:brightness-[1.03]"
                }`}
                style={{ backgroundColor: swatch.hex }}
              >
                {slot.wide ? (
                  <div className="flex h-full items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <div className="mb-1.5">{indexPill}</div>
                      {hexButton("text-lg")}
                    </div>
                    {lockButton}
                  </div>
                ) : (
                  <div className="flex h-full flex-col justify-between p-4 md:p-5">
                    <div className="flex items-start justify-between">
                      {indexPill}
                      {lockButton}
                    </div>
                    <div>
                      {hexButton(slot.big ? "text-3xl md:text-4xl" : "text-xl lg:text-2xl")}
                      <p className="mt-1 text-xs font-semibold opacity-65">{getColorName(swatch.hex)}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {/* Tune */}
          <section className={`${cardTile} col-span-2 grid gap-6 lg:col-[1/9] lg:row-[7/9] lg:grid-cols-[230px_1fr] lg:gap-8`}>
            <div className="flex flex-col justify-between gap-4">
              <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                <Icon name="sliders-horizontal" className="text-base" />
                Selected color
              </p>
              <div className="flex items-center gap-4">
                <div
                  className="size-14 shrink-0 rounded-2xl border border-foreground/10 transition-colors duration-300"
                  style={{ backgroundColor: activeHex }}
                />
                <div className="min-w-0">
                  <h2 className="tabular text-3xl font-extrabold leading-none tracking-[-0.04em]">{activeHex}</h2>
                  <p className="tabular mt-1.5 text-xs font-medium text-muted-foreground">
                    HSL {activeHsl.h}° · {activeHsl.s}% · {activeHsl.l}%
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4">
              {sliders.map((slider) => (
                <label key={slider.key} className="block">
                  <span className="mb-2 flex items-center justify-between text-xs font-bold">
                    {slider.label}
                    <span className="tabular rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                      {slider.value}
                      {slider.unit}
                    </span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={slider.max}
                    value={slider.value}
                    onChange={(event) => updateActive(slider.key, Number(event.target.value))}
                    className="hsl-range"
                    style={{ background: slider.track }}
                  />
                </label>
              ))}
            </div>
          </section>

          {/* Harmony */}
          <section className={`${cardTile} col-span-2 flex flex-col justify-between gap-3 lg:col-[9/13] lg:row-[6/8]`}>
            <p className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Icon name="circles-three" className="text-base" />
              Harmony rule
            </p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Harmony rule">
              {harmonies.map((option) => {
                const active = harmony === option.name;
                return (
                  <button
                    key={option.name}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setHarmony(option.name)}
                    className={`flex h-[52px] items-center gap-2 rounded-2xl px-3.5 text-[13px] font-bold transition active:scale-95 ${
                      active ? "bg-foreground text-background" : "bg-muted hover:bg-secondary"
                    }`}
                  >
                    <Icon name={option.icon} weight={active ? "fill" : "bold"} className="text-base" />
                    {option.name}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-medium text-muted-foreground">Applied on the next generate.</p>
          </section>

          {/* Export */}
          <button
            onClick={exportPalette}
            className={`${tile} group col-span-2 flex min-h-[96px] items-center justify-between bg-accent p-5 text-left text-accent-foreground transition active:scale-[0.99] md:px-6 lg:col-[9/13] lg:row-[8/9]`}
          >
            <span>
              <span className="block text-xl font-extrabold tracking-[-0.03em]">Export CSS</span>
              <span className="block text-xs font-semibold opacity-65">:root variables · {palette.length} colors</span>
            </span>
            <span className="grid size-12 place-items-center rounded-full bg-foreground text-background transition group-hover:scale-110">
              <Icon name="download-simple" className="text-xl" />
            </span>
          </button>
        </div>
      </div>

      <button
        onClick={generate}
        className="fixed bottom-5 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition active:rotate-90 md:hidden"
        aria-label="Generate new palette"
      >
        <Icon name="arrows-clockwise" className="text-xl" />
      </button>

      {showEyePreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowEyePreview(false)}
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#17151c]/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Eye preview for ${activeHex}`}
        >
          <motion.div
            initial={{ y: 28, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-[458px] rounded-[32px] bg-[#fbf0dc] p-[14px] text-[#17151c] shadow-2xl"
          >
            <button
              onClick={() => setShowEyePreview(false)}
              className="absolute right-6 top-6 z-10 grid size-10 place-items-center rounded-full bg-[#fbf0dc] transition hover:rotate-90"
              aria-label="Close eye preview"
            >
              <Icon name="x" className="text-lg" />
            </button>
            <div
              className="flex h-[330px] items-center justify-center overflow-hidden rounded-[22px] px-4 sm:h-[390px]"
              style={{ backgroundColor: activeHex }}
            >
              <EyePair />
            </div>
            <div className="px-3 pb-3 pt-5">
              <p className="tabular text-[clamp(2.6rem,12vw,4rem)] font-extrabold leading-none tracking-[-0.05em]">{activeHex}</p>
              <p className="mt-1.5 text-xl font-bold tracking-[-0.03em]">{getColorName(activeHex)}</p>
              <div className="mt-7 flex items-center justify-between border-t border-[#17151c]/15 pt-4">
                <p className="text-xs font-bold text-[#17151c]/60">Chromatic Creatures</p>
                <button
                  onClick={() => copyColor(activeHex)}
                  className="flex items-center gap-2 rounded-full bg-[#17151c] px-4 py-2 text-xs font-bold text-[#fbf0dc] transition hover:opacity-80"
                >
                  <Icon name="copy" className="text-sm" />
                  Copy color
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {notice && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg"
          role="status"
        >
          <Icon name="check-circle" weight="fill" className="text-lg text-accent" />
          {notice}
        </motion.div>
      )}
    </main>
  );
}
