import { heroTheme } from "./heroTheme";

export const categoriesTheme = {
  // Section background: starts at the hero's edge grey, then eases lighter as you scroll.
  bgStart: heroTheme.bgEdge,
  bgEnd: "#cfcfcf",

  // Text on the section background
  introText: "rgba(17,17,17,0.78)",
  captionText: "rgba(17,17,17,0.6)",
  hintText: "rgba(17,17,17,0.55)",

  // Text and buttons drawn on top of each card's video
  onMedia: "#ffffff",
  onMediaMuted: "rgba(255,255,255,0.78)",
  pillBg: "rgba(255,255,255,0.18)",
  pillText: "rgba(255,255,255,0.92)",
  buttonBg: "#ffffff",
  buttonText: "#111111",

  // The tinted fade at the bottom of each card is the category colour mixed with black.
  // 0 = pure category colour, 1 = black.
  scrimDarken: 0.7,
  fallbackAccent: "#3a3d45",

  // Card back (the pattern you see before a card flips)
  backFrame: "#dcdce0",
  backBase: "#14161b",
  backLine: "#f2f2f4",
  backMid: "#8d8f99",
  backAccent: heroTheme.rimLight,
};
