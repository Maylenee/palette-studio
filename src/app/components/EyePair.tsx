import { useEffect, useRef, useState } from "react";
import { Eye } from "./Eye";

// Native size of two eyes (204 + 4 gap + 204) and one eye
const PAIR_WIDTH = 412;
const EYE_SIZE = 204;

/** Scales the eyes down to fit whatever container they're placed in. */
export function EyePair({ maxScale = 1 }: { maxScale?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(Math.min(maxScale, entry.contentRect.width / PAIR_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [maxScale]);

  return (
    <div ref={wrapRef} className="flex w-full justify-center">
      <div style={{ width: PAIR_WIDTH * scale, height: EYE_SIZE * scale }}>
        <div
          className="flex gap-1"
          style={{ width: PAIR_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <Eye isRightEye={false} />
          <Eye isRightEye />
        </div>
      </div>
    </div>
  );
}
