const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "frames");
fs.mkdirSync(outDir, { recursive: true });

const W = 1280;
const H = 720;
const fps = 30;
const duration = 44;
const total = fps * duration;

const scenes = [
  { start: 0, end: 5, title: "0tru", sub: "Privacy-first optimistic oracle", mode: "intro" },
  { start: 5, end: 11, title: "A false outcome is entered.", sub: "An attacker posts the wrong result and hopes the market accepts it.", mode: "false" },
  { start: 11, end: 17, title: "Anyone can dispute.", sub: "The claim is challenged before it becomes the market's truth.", mode: "dispute" },
  { start: 17, end: 25, title: "The attacker tries to bribe the council.", sub: "But private voting removes the receipt they need to verify corruption.", mode: "bribe" },
  { start: 25, end: 34, title: "The black horses carry the real outcome.", sub: "Voters follow the truth. Their votes and payouts remain hidden.", mode: "horses" },
  { start: 34, end: 44, title: "Truth lands on chain.", sub: "The outcome is public. The witness trail stays dark.", mode: "settle" },
];

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function sceneAt(t) { return scenes.find((s) => t >= s.start && t < s.end) || scenes[scenes.length - 1]; }

function wrapText(text, x, y, size, color, width, weight = 800) {
  const words = text.split(" ");
  const max = Math.max(8, Math.floor(width / (size * 0.52)));
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.map((l, i) => `<text x="${x}" y="${y + i * size * 1.14}" fill="${color}" font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="${weight}">${esc(l)}</text>`).join("");
}

function zeroLogo(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <path d="M8 0 H42 L50 8 V42 L42 50 H8 L0 42 V8 Z M15 14 V36 H36 V14 Z" fill="#FF67B8"/>
    <text x="62" y="39" fill="#FF67B8" font-size="42" font-weight="900" font-family="Inter, Arial, sans-serif">tru</text>
  </g>`;
}

function horse(x, y, s, flip = 1, pink = 0) {
  return `<g transform="translate(${x} ${y}) scale(${s * flip} ${s})">
    <ellipse cx="8" cy="102" rx="132" ry="34" fill="#000" opacity=".28" filter="url(#soft)"/>
    <path d="M-108 10 C-64 -58 70 -54 137 10 C98 18 68 42 52 82 C13 56 -41 54 -108 10Z" fill="#08080A" stroke="#F7F7F4" stroke-opacity=".22" stroke-width="2"/>
    <path d="M70 -35 C101 -88 173 -89 201 -32 C170 -42 144 -25 134 9 C111 -11 92 -23 70 -35Z" fill="#09090B" stroke="#F7F7F4" stroke-opacity=".2" stroke-width="2"/>
    <path d="M128 -74 L146 -132 L159 -65" fill="#050507"/>
    <circle cx="166" cy="-28" r="5" fill="${pink ? "#FF67B8" : "#F7F7F4"}" opacity=".85"/>
    <path d="M62 -42 C14 -95 -62 -92 -122 -62 C-70 -60 -28 -39 12 0" fill="none" stroke="${pink ? "#FF67B8" : "#F7F7F4"}" stroke-opacity=".42" stroke-width="8"/>
    <path d="M-72 58 L-120 164 M-18 72 L-6 174 M50 74 L80 164 M112 46 L154 142" stroke="#060608" stroke-width="20" stroke-linecap="round"/>
    <path d="M-72 58 L-120 164 M-18 72 L-6 174 M50 74 L80 164 M112 46 L154 142" stroke="#F7F7F4" stroke-opacity=".16" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function voterCouncil(cx, cy, t, hidden) {
  return Array.from({ length: 12 }, (_, n) => {
    const a = (n / 12) * Math.PI * 2 + t * 0.15;
    const r = 112;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    return `<g>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="20" fill="${hidden ? "#242426" : "#3A3036"}" stroke="${hidden ? "#FF67B8" : "#A6A0A4"}" stroke-opacity=".75"/>
      <text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle" fill="${hidden ? "#FF67B8" : "#F7F7F4"}" font-size="16" font-weight="900" font-family="JetBrains Mono, monospace">${hidden ? "?" : "$"}</text>
    </g>`;
  }).join("");
}

function card(x, y, w, h, label, value, accent = "#FF67B8", danger = false) {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#242426" stroke="${danger ? "#FF3B5F" : accent}" stroke-opacity=".55"/>
    <text x="${x + 24}" y="${y + 38}" fill="${accent}" font-family="JetBrains Mono, monospace" font-size="16" font-weight="700">${esc(label)}</text>
    <text x="${x + 24}" y="${y + 84}" fill="#F7F7F4" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">${esc(value)}</text>
  </g>`;
}

function frame(i) {
  const t = i / fps;
  const s = sceneAt(t);
  const local = (t - s.start) / (s.end - s.start);
  const opacity = Math.min(ease(local * 4), ease((1 - local) * 4));
  const drift = t * 34;
  const horseRun = (t * 140) % 1660;
  const dust = Array.from({ length: 44 }, (_, n) => {
    const x = (n * 67 + drift * (0.4 + (n % 3) * 0.18)) % 1380 - 50;
    const y = 120 + ((n * 31 + drift) % 520);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${2 + (n % 7)}" fill="#F7F7F4" opacity="${0.018 + (n % 4) * 0.012}"/>`;
  }).join("");

  const mode = s.mode;
  const falseOpacity = ["false", "dispute", "bribe"].includes(mode) ? 1 : mode === "settle" ? 0.12 : 0;
  const disputeOpacity = ["dispute", "bribe", "horses", "settle"].includes(mode) ? 1 : 0;
  const bribeOpacity = mode === "bribe" ? 1 : 0;
  const hidden = ["bribe", "horses", "settle"].includes(mode);
  const horseOpacity = ["intro", "horses", "settle"].includes(mode) ? 1 : mode === "bribe" ? 0.32 : 0.15;
  const settlementOpacity = mode === "settle" ? 1 : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>
      <radialGradient id="pinkGlow" cx="72%" cy="50%" r="48%">
        <stop offset="0" stop-color="#FF67B8" stop-opacity=".16"/>
        <stop offset="55%" stop-color="#FF67B8" stop-opacity=".04"/>
        <stop offset="100%" stop-color="#0B0B0D" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="#0B0B0D"/>
    <rect width="${W}" height="${H}" fill="url(#pinkGlow)"/>
    <g opacity=".16">
      ${Array.from({ length: 240 }, (_, n) => `<circle cx="${(n * 113) % 1280}" cy="${(n * 47) % 720}" r="${(n % 3) + 0.4}" fill="#F7F7F4" opacity=".18"/>`).join("")}
    </g>
    ${dust}
    ${zeroLogo(70, 46, .78)}
    <rect x="64" y="112" width="1152" height="542" rx="34" fill="#1A1A1C" stroke="#F7F7F4" stroke-opacity=".1"/>
    <g opacity="${horseOpacity}">
      ${horse(980 - horseRun * 0.16, 365, 1.12, -1, 1)}
      ${horse(1220 - horseRun * 0.20, 382, .9, -1, 0)}
    </g>
    <g opacity="${falseOpacity}">
      ${card(702, 174, 358, 120, "proposed outcome", "FALSE", "#FF3B5F", true)}
      <path d="M882 294 V388" stroke="#FF3B5F" stroke-width="4" stroke-dasharray="10 10"/>
    </g>
    <g opacity="${disputeOpacity}">
      ${card(732, 402, 300, 104, "dispute", "OPENED", "#FF67B8")}
    </g>
    <g opacity="${bribeOpacity}">
      <path d="M270 410 C410 318 500 318 612 410" fill="none" stroke="#FF67B8" stroke-width="4" stroke-dasharray="8 10"/>
      <rect x="160" y="352" width="168" height="88" rx="14" fill="#32222B" stroke="#FF67B8" stroke-opacity=".58"/>
      <text x="244" y="387" text-anchor="middle" fill="#FF67B8" font-family="JetBrains Mono, monospace" font-size="16" font-weight="700">attacker</text>
      <text x="244" y="420" text-anchor="middle" fill="#F7F7F4" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="900">BRIBE?</text>
    </g>
    <g opacity="${hidden ? 1 : mode === "dispute" ? .55 : .18}">
      ${voterCouncil(510, 416, t, hidden)}
      <circle cx="510" cy="416" r="56" fill="#0B0B0D" stroke="#FF67B8" stroke-width="3"/>
      <text x="510" y="424" text-anchor="middle" fill="#FF67B8" font-family="JetBrains Mono, monospace" font-size="28" font-weight="900">${hidden ? "ZK" : "VOTE"}</text>
    </g>
    <g opacity="${settlementOpacity}">
      <rect x="714" y="174" width="384" height="126" rx="20" fill="#FF67B8"/>
      <text x="906" y="226" text-anchor="middle" fill="#12040B" font-family="JetBrains Mono, monospace" font-size="18" font-weight="800">settled outcome</text>
      <text x="906" y="270" text-anchor="middle" fill="#12040B" font-family="Inter, Arial, sans-serif" font-size="40" font-weight="900">TRUE</text>
    </g>
    <g opacity="${opacity}">
      <text x="102" y="218" fill="#FF67B8" font-family="JetBrains Mono, monospace" font-size="15" font-weight="800">PRIVACY-FIRST OPTIMISTIC ORACLE</text>
      ${wrapText(s.title, 102, mode === "intro" ? 314 : 292, mode === "intro" ? 86 : 52, mode === "intro" ? "#FF67B8" : "#F7F7F4", 560, 900)}
      ${wrapText(s.sub, 106, mode === "intro" ? 392 : 418, 25, "#B8B2B6", 540, 600)}
    </g>
    <text x="102" y="608" fill="#FF67B8" font-family="JetBrains Mono, monospace" font-size="15" font-weight="800" opacity=".92">public truth / private witnesses / no bribery receipt</text>
  </svg>`;
}

for (let i = 0; i < total; i += 1) {
  fs.writeFileSync(path.join(outDir, `frame_${String(i).padStart(4, "0")}.svg`), frame(i));
}

console.log(`Wrote ${total} story frames to ${outDir}`);
