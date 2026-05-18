export const Colors = {
  primary: "#A98B76",
  primaryDark: "#8B6F5A",
  primaryLight: "#C4A992",
  secondary: "#BFA98E",
  cream: "#EFE5C8",
  creamLight: "#F7F2E5",
  creamDark: "#DDD0B3",
  sage: "#8FA870",
  sageDark: "#6B8054",
  sageLight: "#A8BF8E",
  stone50: "#FAF8F5",
  stone100: "#F2EDE4",
  stone200: "#E5DAC8",
  stone300: "#D4C4A8",
  stone400: "#BFA98E",
  stone500: "#A98B76",
  stone600: "#8B6F5A",
  stone700: "#6B5142",
  stone800: "#4A3630",
  stone900: "#2D201C",
  white: "#FFFFFF",
  error: "#EF4444",
  warning: "#F59E0B",
  success: "#8FA870",
};

export const StatusColors: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  approved: { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  rejected: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
};

export const StatusLabel: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};
