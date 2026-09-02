import { Circle, Flame, Palette, Snowflake, SunMedium } from "lucide-react";

interface HairColourSymbolProps {
  name: string;
  size?: number;
}

const colourSymbols: Record<string, { Icon: typeof Circle; colour: string; fill?: boolean }> = {
  blondie: { Icon: SunMedium, colour: "#eab308" },
  brownie: { Icon: Circle, colour: "#8b5e3c", fill: true },
  goldie: { Icon: SunMedium, colour: "#c28b22" },
  black: { Icon: Circle, colour: "#262626", fill: true },
  ginger: { Icon: Flame, colour: "#ea580c", fill: true },
  snowflake: { Icon: Snowflake, colour: "#38a3db" },
} as const;

export function HairColourSymbol({ name, size = 15 }: HairColourSymbolProps) {
  const key = name.trim().toLowerCase() as keyof typeof colourSymbols;
  const symbol = colourSymbols[key];
  const Icon = symbol?.Icon || Palette;

  return (
    <span
      className="inline-flex shrink-0 items-center"
      title={`${name} colour symbol`}
      aria-label={`${name} colour symbol`}
      role="img"
    >
      <Icon
        size={size}
        strokeWidth={symbol?.fill ? 1.5 : 1.8}
        color={symbol?.colour || "#8c7a72"}
        fill={symbol?.fill ? symbol.colour : "none"}
      />
    </span>
  );
}

export function BookingColourLabel({ label, name }: { label: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}:</span>
      <HairColourSymbol name={name} />
      <span>{name}</span>
    </span>
  );
}
