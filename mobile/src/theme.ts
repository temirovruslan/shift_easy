import palette from "../colors.json";

export const fonts = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semibold: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
};

/**
 * Re-exported from colors.json, which tailwind.config.js reads too. The list
 * used to be written out in both files, so a colour changed in one place and
 * not the other produced components that disagreed with their own utility
 * classes.
 */
export const colors = palette;
