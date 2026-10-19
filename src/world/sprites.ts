// Hand-drawn ASCII sprites, typed like Stone Story RPG's: anything the visitor must recognise at a
// glance is drawn by hand, never converted from 3D. Each frame is rows of text plus a same-sized
// colour mask: a mask letter picks the colour of the character above it from PALETTE, space = default ink.

export type Sprite = { art: string[]; mask: string[] };

export const PALETTE: Record<string, string> = {
  k: "#1c2420", // ink
  s: "#a0603e", // skin
  r: "#b23a2a", // shirt
  p: "#2f3e5c", // trousers
  b: "#5a3d26", // bark
  e: "#b08850", // cut end of the log
  g: "#4f7a3a", // grass
};

/** Pads every row (art and mask) to one width, so frames line up without hand-counting spaces. */
function sprite(art: string[], mask: string[]): Sprite {
  const w = Math.max(...art.map((l) => l.length), ...mask.map((l) => l.length));
  return { art: art.map((l) => l.padEnd(w)), mask: mask.map((l) => l.padEnd(w)) };
}

// The log: bark with a cut end facing us on the left, grass at its foot.
const LOG = [
  "   ____________________________________",
  "  /   \\                                \\",
  " | (@) |  -   _    -    _    -    _     |",
  "  \\___/________________________________/",
  "   \"  ,   '  \"     ,    \"   '   ,  \"   '",
];
const LOG_MASK = [
  "   bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "  beeeeb                                b",
  " beeeeeeb b   b    b    b    b    b     b",
  "  beeeebbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  "   g  g   g  g     g    g   g   g  g   g",
];

// The figure asleep on their back along the log, head on the left. Frames alternate as they breathe.
export const SLEEPER: Sprite[] = [
  sprite(
    [
      "       ,---.",
      "      ( -.- )_____________.______________",
      "   ____`---'(_____________|_____________/=)",
      ...LOG.slice(1),
    ],
    [
      "       sssss",
      "      sssssssrrrrrrrrrrrrrppppppppppppppp",
      "   bbbbssssssrrrrrrrrrrrrrrrpppppppppppppkkk",
      ...LOG_MASK.slice(1),
    ],
  ),
  sprite(
    [
      "       ,---.    _.--------._",
      "      ( -.- )_.'            `.____________",
      "   ____`---'(_____________|_____________/=)",
      ...LOG.slice(1),
    ],
    [
      "       sssss    rrrrrrrrrrrr",
      "      sssssssrrrrrrrrrrrrrrrrppppppppppppp",
      "   bbbbssssssrrrrrrrrrrrrrrrpppppppppppppkkk",
      ...LOG_MASK.slice(1),
    ],
  ),
];

/** The empty log, once they have got up. Same footprint as the sleeper's bottom rows. */
export const LOG_ONLY = sprite(LOG, LOG_MASK);

export const STANDING = sprite(
  [
    " ,---. ",
    "( o.o )",
    " `-+-' ",
    " /|#|\\ ",
    "  |_|  ",
    "  / \\  ",
    " '   ' ",
  ],
  [
    " sssss ",
    "sssssss",
    " sssss ",
    " srrrs ",
    "  ppp  ",
    "  p p  ",
    " k   k ",
  ],
);

// Butterflies: wings open, wings shut.
export const BUTTERFLY = ["}o{", ">o<"];
export const BUTTERFLY_COLORS = ["#d08a1e", "#9a4fc0", "#2f7fc0"];
