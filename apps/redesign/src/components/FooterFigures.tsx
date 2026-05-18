"use client";

// Faceless silhouette figures sitting on the footer edge.
// Light sage tones so they read clearly against the dark green footer.

const BODY = "#a8d5b5"; // light sage — main figure colour
const SHADE = "#7bbf96"; // slightly darker for depth
const CLIP = "#c8e6d3"; // clipboard face
const PAPER = "rgba(255,255,255,0.7)"; // lines on paper

const KEYFRAMES = `
  @keyframes fig-sway {
    0%,100% { transform: rotate(-1.5deg); }
    50%      { transform: rotate(1.5deg);  }
  }
  @keyframes fig-bob {
    0%,100% { transform: translateY(0);   }
    50%      { transform: translateY(-3px);}
  }
  @keyframes fig-wave {
    0%,100% { transform: rotate(-2deg);  }
    50%      { transform: rotate(2deg);   }
  }
`;

// ── primitives ────────────────────────────────────────────────────────────────

const Head = ({ x, y, r = 10 }: { x: number; y: number; r?: number }) => (
  <circle cx={x} cy={y} r={r} fill={BODY} />
);

const Torso = ({ x, y, w = 16, h = 24 }: { x: number; y: number; w?: number; h?: number }) => (
  <rect x={x - w / 2} y={y} width={w} height={h} rx={3} fill={BODY} />
);

type Pt = { x: number; y: number };
const Arm = ({ from, to, thick = 5 }: { from: Pt; to: Pt; thick?: number }) => (
  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
    stroke={BODY} strokeWidth={thick} strokeLinecap="round" />
);

const Leg = ({ from, to }: { from: Pt; to: Pt }) => (
  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
    stroke={SHADE} strokeWidth={6} strokeLinecap="round" />
);

const Clipboard = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x} y={y} width={14} height={18} rx={2} fill={CLIP} />
    <rect x={x + 4} y={y - 3} width={6} height={5} rx={1} fill={SHADE} />
    <line x1={x + 2} y1={y + 6} x2={x + 12} y2={y + 6} stroke={PAPER} strokeWidth={1.2} />
    <line x1={x + 2} y1={y + 9} x2={x + 12} y2={y + 9} stroke={PAPER} strokeWidth={1.2} />
    <line x1={x + 2} y1={y + 12} x2={x + 9} y2={y + 12} stroke={PAPER} strokeWidth={1.2} />
  </g>
);

// ── figures (all drawn relative to a baseline of y=0) ────────────────────────

// Standing, clipboard in left hand, right arm pointing out
const StandingPointer = () => (
  <g>
    <Head x={0} y={-78} />
    <Torso x={0} y={-67} />
    {/* left arm → clipboard */}
    <Arm from={{ x: -8, y: -60 }} to={{ x: -22, y: -48 }} />
    <Clipboard x={-30} y={-56} />
    {/* right arm pointing */}
    <Arm from={{ x: 8, y: -60 }} to={{ x: 26, y: -52 }} />
    {/* legs */}
    <Leg from={{ x: -4, y: -43 }} to={{ x: -6, y: -18 }} />
    <Leg from={{ x: 4, y: -43 }} to={{ x: 7, y: -18 }} />
    {/* feet */}
    <Arm from={{ x: -6, y: -18 }} to={{ x: -12, y: -18 }} thick={4} />
    <Arm from={{ x: 7, y: -18 }} to={{ x: 13, y: -18 }} thick={4} />
  </g>
);

// Seated on edge, both hands on a shared clipboard
const SeatedCollaborator = () => (
  <g>
    <Head x={0} y={-70} />
    <Torso x={0} y={-59} h={22} />
    {/* arms forward onto clipboard */}
    <Arm from={{ x: -8, y: -50 }} to={{ x: -14, y: -38 }} />
    <Arm from={{ x: 8, y: -50 }} to={{ x: 14, y: -38 }} />
    <Clipboard x={-8} y={-42} />
    {/* dangling legs */}
    <Leg from={{ x: -4, y: -37 }} to={{ x: -6, y: -14 }} />
    <Leg from={{ x: 4, y: -37 }} to={{ x: 8, y: -14 }} />
    <Leg from={{ x: -6, y: -14 }} to={{ x: -10, y: -6 }} />
    <Leg from={{ x: 8, y: -14 }} to={{ x: 13, y: -6 }} />
  </g>
);

// Arm raised — presenting / celebrating
const Presenter = () => (
  <g>
    <Head x={0} y={-80} r={9} />
    <Torso x={0} y={-70} w={14} h={24} />
    {/* raised arm */}
    <Arm from={{ x: -7, y: -62 }} to={{ x: -18, y: -78 }} />
    {/* other arm with clipboard */}
    <Arm from={{ x: 7, y: -62 }} to={{ x: 20, y: -54 }} />
    <Clipboard x={18} y={-62} />
    {/* legs */}
    <Leg from={{ x: -3, y: -46 }} to={{ x: -5, y: -22 }} />
    <Leg from={{ x: 3, y: -46 }} to={{ x: 6, y: -22 }} />
    <Arm from={{ x: -5, y: -22 }} to={{ x: -10, y: -22 }} thick={4} />
    <Arm from={{ x: 6, y: -22 }} to={{ x: 12, y: -22 }} thick={4} />
  </g>
);

// Crouching — inspecting something on the ground
const Inspector = () => (
  <g>
    <Head x={0} y={-55} r={9} />
    <Torso x={0} y={-46} w={14} h={18} />
    <Arm from={{ x: -7, y: -38 }} to={{ x: -16, y: -26 }} />
    <Arm from={{ x: 7, y: -38 }} to={{ x: 16, y: -26 }} />
    <Clipboard x={-8} y={-32} />
    {/* crouched legs */}
    <Leg from={{ x: -3, y: -28 }} to={{ x: -10, y: -10 }} />
    <Leg from={{ x: 3, y: -28 }} to={{ x: 11, y: -10 }} />
    <Arm from={{ x: -10, y: -10 }} to={{ x: -17, y: -6 }} thick={4} />
    <Arm from={{ x: 11, y: -10 }} to={{ x: 18, y: -6 }} thick={4} />
  </g>
);

// Waving — small, friendly
const Waver = () => (
  <g>
    <Head x={0} y={-62} r={8} />
    <Torso x={0} y={-53} w={13} h={20} />
    {/* waving arm */}
    <Arm from={{ x: 6, y: -46 }} to={{ x: 18, y: -60 }} thick={4} />
    {/* other arm */}
    <Arm from={{ x: -6, y: -46 }} to={{ x: -15, y: -38 }} thick={4} />
    <Leg from={{ x: -3, y: -33 }} to={{ x: -5, y: -14 }} />
    <Leg from={{ x: 3, y: -33 }} to={{ x: 6, y: -14 }} />
    <Arm from={{ x: -5, y: -14 }} to={{ x: -9, y: -14 }} thick={3} />
    <Arm from={{ x: 6, y: -14 }} to={{ x: 11, y: -14 }} thick={3} />
  </g>
);

// ── layout ────────────────────────────────────────────────────────────────────

const figures: Array<{ Component: () => React.ReactElement; x: number; anim: string; origin: string }> = [
  { Component: StandingPointer, x: 120, anim: "fig-sway 5s ease-in-out infinite", origin: "50% 100%" },
  { Component: Waver, x: 300, anim: "fig-wave 2.8s ease-in-out infinite", origin: "50% 100%" },
  { Component: SeatedCollaborator, x: 500, anim: "fig-bob  4s ease-in-out infinite", origin: "50% 100%" },
  { Component: Presenter, x: 720, anim: "fig-sway 6s ease-in-out infinite reverse", origin: "50% 100%" },
  { Component: Inspector, x: 930, anim: "fig-bob  5s ease-in-out infinite 0.5s", origin: "50% 100%" },
  { Component: StandingPointer, x: 1140, anim: "fig-sway 4.5s ease-in-out infinite 1s", origin: "50% 100%" },
  { Component: Waver, x: 1320, anim: "fig-wave 3s ease-in-out infinite 0.8s", origin: "50% 100%" },
];

export default function FooterFigures() {
  return (
    <div aria-hidden="true" style={{ width: "100%", overflow: "hidden", lineHeight: 0 }}>
      <style>{KEYFRAMES}</style>
      <svg
        width="100%"
        viewBox="0 0 1440 100"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet"
      >
        {/* baseline */}
        <line x1="0" y1="98" x2="1440" y2="98" stroke="#1a6b47" strokeWidth="2" />

        {figures.map(({ Component, x, anim, origin }, i) => (
          <g
            key={i}
            transform={`translate(${x}, 98)`}
            style={{ animation: anim, transformOrigin: origin }}
          >
            <Component />
          </g>
        ))}
      </svg>
    </div>
  );
}
