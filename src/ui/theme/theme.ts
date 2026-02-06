export const theme = {
  colors: {
    bg: "#070912",
    panel: "#0D1020",
    text: "#EAF0FF",
    muted: "#A6B0D6",
    border: "rgba(140, 160, 255, 0.18)",
    neon: "#9B5CFF",
    neon2: "#4DE1FF",
    danger: "#FF4D6D",
    success: "#45FF9C",
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
  },
  spacing: (n: number) => n * 8,
  font: {
    mono: undefined,
  },
} as const;

export type Theme = typeof theme;
