export type FeeTier = { label: string; maxCents: number; rate: number };

export type FeeTierSettings = {
  tier1MaxBaht: number;
  tier1Rate: number;
  tier2MaxBaht: number;
  tier2Rate: number;
  tier3Rate: number;
};

export function buildFeeTiers(settings: FeeTierSettings): FeeTier[] {
  return [
    {
      label: `≤ ฿${settings.tier1MaxBaht.toLocaleString()}`,
      maxCents: settings.tier1MaxBaht * 100,
      rate: settings.tier1Rate,
    },
    {
      label: `฿${settings.tier1MaxBaht.toLocaleString()} – ฿${settings.tier2MaxBaht.toLocaleString()}`,
      maxCents: settings.tier2MaxBaht * 100,
      rate: settings.tier2Rate,
    },
    {
      label: `> ฿${settings.tier2MaxBaht.toLocaleString()}`,
      maxCents: Infinity,
      rate: settings.tier3Rate,
    },
  ];
}

export function getFeeTier(tiers: FeeTier[], totalCents: number) {
  return tiers.find((t) => totalCents <= t.maxCents) ?? tiers[tiers.length - 1];
}

export function calculatePlatformFeeCents(tiers: FeeTier[], totalCents: number) {
  return Math.round(totalCents * getFeeTier(tiers, totalCents).rate);
}
