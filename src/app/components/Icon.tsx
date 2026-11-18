// Phosphor Icons, loaded from CDN in index.html (no npm package).
// Usage: <Icon name="palette" weight="bold" className="text-lg" />
type IconProps = {
  name: string;
  weight?: "regular" | "bold" | "fill";
  className?: string;
};

export function Icon({ name, weight = "bold", className = "" }: IconProps) {
  const base = weight === "regular" ? "ph" : `ph-${weight}`;
  return <i aria-hidden="true" className={`${base} ph-${name} leading-none ${className}`} />;
}
