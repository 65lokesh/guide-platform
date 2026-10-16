"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import { categoriesTheme as C } from "./categoriesTheme";

export type CategoryCardData = {
  slug: string;
  name: string;
  description: string | null;
  themeColor: string | null;
  videoUrl?: string | null; // per-category clip; falls back to DEFAULT_VIDEO
  tags?: string[]; // small pills on the card (first two are shown)
  guideCount?: number; // shown as a pill next to the name
};

/* ---------- TUNING KNOBS ---------- */
const TRACK_VH = 400; // scroll length of the whole animation (bigger = slower)
const FADE_PX = 180; // soft blend from the hero's bottom edge into this section
const CARD_W = 1;
const CARD_H = 1.45;
const RADIUS = 0.1; // card corner roundness (fraction of card width)
const TEX_W = 800;
const TEX_H = Math.round((TEX_W * CARD_H) / CARD_W);

// Video
const DEFAULT_VIDEO = "/videos/category.mp4"; // used when a category has no hoverVideoUrl. "" = no video
const LOOP_VIDEO = true; // false = play the 5s clip once and hold the last frame
const VIDEO_START_AT = 0.95; // flip progress (0-1) at which the video starts

// Scroll progress (0 -> 1) for every phase
const T = {
  bg: [0.0, 0.1], // background eases from hero grey to lighter grey
  drop: { start: 0.08, stagger: 0.045, dur: 0.14 }, // cards fall in as a fanned stack
  spread: [0.4, 0.56], // stack opens into a row
  flip: { start: 0.6, stagger: 0.04, dur: 0.14 }, // staggered flips
  caption: [0.86, 0.95], // "click a card" hint fades in
} as const;
/* ---------------------------------- */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const pad = (n: number) => String(n).padStart(2, "0");

/* ---------- Textures (drawn on canvas, no image files needed) ---------- */

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function wrapLines(g: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

// Card back: patterned, monochrome with one periwinkle accent (matches the robot's rim light)
function makeBackTexture(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  const g = c.getContext("2d")!;
  const S = TEX_W / 512;

  g.fillStyle = C.backFrame;
  g.fillRect(0, 0, TEX_W, TEX_H);
  const m = Math.round(22 * S);
  g.fillStyle = C.backBase;
  roundRect(g, m, m, TEX_W - 2 * m, TEX_H - 2 * m, 14 * S);
  g.fill();

  g.save();
  roundRect(g, m, m, TEX_W - 2 * m, TEX_H - 2 * m, 14 * S);
  g.clip();
  g.translate(TEX_W / 2, TEX_H / 2);
  g.scale(S, S);

  for (let r = 11; r >= 1; r--) {
    const rad = r * 34;
    g.lineWidth = r % 2 ? 6 : 3;
    g.strokeStyle = r % 3 === 0 ? C.backAccent : r % 2 ? C.backLine : C.backMid;
    g.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.02) {
      const k = 1 + 0.18 * Math.sin(a * 8 + r * 0.7);
      const x = Math.cos(a) * rad * k;
      const y = Math.sin(a) * rad * k * 1.25;
      if (a === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }

  g.rotate(Math.PI / 4);
  g.strokeStyle = "rgba(255,255,255,.2)";
  g.lineWidth = 2;
  for (let i = -16; i <= 16; i++) {
    g.beginPath();
    g.moveTo(i * 28, -600);
    g.lineTo(i * 28, 600);
    g.stroke();
    g.beginPath();
    g.moveTo(-600, i * 28);
    g.lineTo(600, i * 28);
    g.stroke();
  }
  g.rotate(-Math.PI / 4);

  g.fillStyle = C.backBase;
  g.beginPath();
  g.arc(0, 0, 70, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = C.backAccent;
  g.lineWidth = 8;
  g.stroke();
  g.fillStyle = C.backLine;
  for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
      if (i * i + j * j <= 9) {
        g.beginPath();
        g.arc(i * 14, j * 14, 4.5, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  g.restore();

  g.strokeStyle = C.backLine;
  g.lineWidth = 3;
  roundRect(g, m + 8 * S, m + 8 * S, TEX_W - 2 * (m + 8 * S), TEX_H - 2 * (m + 8 * S), 10 * S);
  g.stroke();
  return c;
}

// "#rrggbb" or "#rgb" -> [r, g, b] mixed toward black by k (0 = unchanged, 1 = black)
function shade(hex: string, k: number): [number, number, number] {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [17, 17, 17];
  let h = m[1];
  if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
  const n = parseInt(h, 16);
  const f = 1 - k;
  return [Math.round(((n >> 16) & 255) * f), Math.round(((n >> 8) & 255) * f), Math.round((n & 255) * f)];
}

// Fallback face shown until the video is ready (or if it can't load): category colour, fading darker.
function makeBaseTexture(accent: string): HTMLCanvasElement {
  const w = 256;
  const h = Math.round((w * CARD_H) / CARD_W);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const [r, gg, b] = shade(accent, 0.55);
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, accent);
  grad.addColorStop(1, `rgb(${r}, ${gg}, ${b})`);
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(255,255,255,0.28)";
  g.lineWidth = 5;
  g.beginPath();
  g.arc(w / 2, h * 0.34, 34, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.28)";
  g.beginPath();
  g.arc(w / 2, h * 0.34, 14, 0, Math.PI * 2);
  g.fill();
  return c;
}

// Everything drawn on top of the video: tinted fade, index, name, description, tags, button.
// This layer is transparent, so the video shows through the top of the card.
function makeOverlayTexture(card: CategoryCardData, index: number, total: number, font: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TEX_W;
  c.height = TEX_H;
  const g = c.getContext("2d")!;
  const accent = card.themeColor ?? C.fallbackAccent;
  const [r, gg, b] = shade(accent, C.scrimDarken);
  const M = 56; // side and bottom margin

  // soft dark fade at the top so the index stays readable on bright video
  let grad = g.createLinearGradient(0, 0, 0, TEX_H * 0.2);
  grad.addColorStop(0, "rgba(0,0,0,0.38)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, TEX_W, TEX_H * 0.2);

  // category-tinted fade from the middle down to the bottom
  const fadeTop = TEX_H * 0.34;
  grad = g.createLinearGradient(0, fadeTop, 0, TEX_H);
  grad.addColorStop(0, `rgba(${r}, ${gg}, ${b}, 0)`);
  grad.addColorStop(0.5, `rgba(${r}, ${gg}, ${b}, 0.68)`);
  grad.addColorStop(1, `rgba(${r}, ${gg}, ${b}, 0.96)`);
  g.fillStyle = grad;
  g.fillRect(0, fadeTop, TEX_W, TEX_H - fadeTop);

  g.textAlign = "left";
  g.textBaseline = "alphabetic";

  // index pill, top-left
  const indexText = `${pad(index + 1)} / ${pad(total)}`;
  g.font = `500 26px ${font}`;
  const iw = g.measureText(indexText).width + 40;
  g.fillStyle = "rgba(0,0,0,0.32)";
  roundRect(g, M, M, iw, 52, 26);
  g.fill();
  g.fillStyle = C.onMedia;
  g.textBaseline = "middle";
  g.fillText(indexText, M + 20, M + 27);
  g.textBaseline = "alphabetic";

  // bottom block, laid out upwards from the bottom edge
  let y = TEX_H - M;

  // button
  const btnH = 96;
  y -= btnH;
  g.fillStyle = C.buttonBg;
  roundRect(g, M, y, TEX_W - 2 * M, btnH, btnH / 2);
  g.fill();
  g.fillStyle = C.buttonText;
  g.font = `600 34px ${font}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("Open guides \u2192", TEX_W / 2, y + btnH / 2 + 1);
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  y -= 30;

  // tag pills
  const tags = (card.tags ?? []).slice(0, 2);
  if (tags.length) {
    const tagH = 54;
    y -= tagH;
    let tx = M;
    g.font = `500 26px ${font}`;
    for (const t of tags) {
      const tw = g.measureText(t).width + 40;
      if (tx + tw > TEX_W - M) break;
      g.fillStyle = C.pillBg;
      roundRect(g, tx, y, tw, tagH, tagH / 2);
      g.fill();
      g.fillStyle = C.pillText;
      g.textBaseline = "middle";
      g.fillText(t, tx + 20, y + tagH / 2 + 1);
      g.textBaseline = "alphabetic";
      tx += tw + 12;
    }
    y -= 28;
  }

  // description (max 2 lines)
  g.shadowColor = "rgba(0,0,0,0.35)";
  g.shadowBlur = 12;
  if (card.description) {
    g.font = `400 31px ${font}`;
    const lines = wrapLines(g, card.description, TEX_W - 2 * M, 2);
    const lh = 42;
    y -= lines.length * lh;
    g.fillStyle = C.onMediaMuted;
    lines.forEach((line, i) => g.fillText(line, M, y + 31 + i * lh));
    y -= 24;
  }

  // name, with the guide count pill on the same line
  g.font = `700 68px ${font}`;
  g.fillStyle = C.onMedia;
  g.fillText(card.name, M, y);
  const nameW = g.measureText(card.name).width;
  g.shadowColor = "transparent";
  g.shadowBlur = 0;

  if (typeof card.guideCount === "number") {
    const label = `${card.guideCount} ${card.guideCount === 1 ? "guide" : "guides"}`;
    g.font = `500 26px ${font}`;
    const pw = g.measureText(label).width + 40;
    if (nameW + 24 + pw <= TEX_W - 2 * M) {
      const py = y - 52;
      g.fillStyle = "rgba(0,0,0,0.38)";
      roundRect(g, TEX_W - M - pw, py, pw, 54, 27);
      g.fill();
      g.fillStyle = C.onMedia;
      g.textBaseline = "middle";
      g.fillText(label, TEX_W - M - pw + 20, py + 28);
      g.textBaseline = "alphabetic";
    }
  }
  return c;
}

function roundedGeometry(w: number, h: number, r: number): THREE.ShapeGeometry {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ShapeGeometry(s, 10);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  return geo;
}

type VideoRes = {
  video: HTMLVideoElement;
  texture: THREE.VideoTexture;
  failed: boolean;
  requested: boolean;
  retryAt: number;
};

type CardObj = {
  group: THREE.Group;
  flip: THREE.Group;
  tilt: number;
  i: number;
  hover: number;
  hoverTarget: number;
  flipT: number;
  res: VideoRes | null;
  videoMat: THREE.MeshBasicMaterial | null;
  videoMesh: THREE.Mesh | null;
  videoOn: boolean;
  videoAlpha: number;
};

export default function CategoriesScroll({ categories }: { categories: CategoryCardData[] }) {
  const router = useRouter();
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLHeadingElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const mount = mountRef.current;
    const introEl = introRef.current;
    const captionEl = captionRef.current;
    const hintEl = hintRef.current;
    if (!track || !stage || !mount || !introEl || !captionEl || !hintEl) return;

    const data = categories;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const start = (font: string): (() => void) | undefined => {
      const canvas = document.createElement("canvas");
      canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
      mount.appendChild(canvas);

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch {
        canvas.remove(); // no WebGL: the hidden links below still work
        return undefined;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.z = 10;
      const viewHeightAtZero = () => 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

      const textures: THREE.Texture[] = [];
      const materials: THREE.Material[] = [];
      const toTexture = (el: HTMLCanvasElement) => {
        const t = new THREE.CanvasTexture(el);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textures.push(t);
        return t;
      };

      // One <video> + texture per unique URL (cards that share a clip share one decoder).
      const videoRes = new Map<string, VideoRes>();
      const getVideo = (url: string): VideoRes => {
        const existing = videoRes.get(url);
        if (existing) return existing;

        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.loop = LOOP_VIDEO;
        video.playsInline = true;
        video.preload = "auto";
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);

        const res: VideoRes = { video, texture, failed: false, requested: false, retryAt: 0 };

        // "cover" fit: centre-crop the clip so it fills the window without stretching
        video.addEventListener("loadedmetadata", () => {
          if (!video.videoWidth || !video.videoHeight) return;
          const va = video.videoWidth / video.videoHeight;
          const wa = CARD_W / CARD_H; // the video fills the whole card
          if (va > wa) {
            texture.repeat.set(wa / va, 1);
            texture.offset.set((1 - wa / va) / 2, 0);
          } else {
            texture.repeat.set(1, va / wa);
            texture.offset.set(0, (1 - va / wa) / 2);
          }
        });
        video.addEventListener("error", () => {
          res.failed = true; // missing or unsupported file: the placeholder stays
        });

        video.src = url;
        video.load();
        videoRes.set(url, res);
        return res;
      };

      const geo = roundedGeometry(CARD_W, CARD_H, RADIUS);
      const backTex = toTexture(makeBackTexture());
      const cards: CardObj[] = [];
      const tilts = [0.05, -0.035, 0.03, -0.05, 0.04];

      data.forEach((item, i) => {
        const group = new THREE.Group();
        const flip = new THREE.Group();
        group.add(flip);

        const accent = item.themeColor ?? C.fallbackAccent;
        const backMat = new THREE.MeshBasicMaterial({ map: backTex });
        const frontMat = new THREE.MeshBasicMaterial({ map: toTexture(makeBaseTexture(accent)) });
        const overlayMat = new THREE.MeshBasicMaterial({
          map: toTexture(makeOverlayTexture(item, i, data.length, font)),
          transparent: true,
          depthWrite: false,
        });
        materials.push(backMat, frontMat, overlayMat);

        const back = new THREE.Mesh(geo, backMat);
        back.position.z = 0.003;
        const front = new THREE.Mesh(geo, frontMat);
        front.rotation.y = Math.PI;
        front.position.z = -0.003;
        flip.add(back, front);

        // video layer: covers the whole card face, hidden until the card has flipped
        let res: VideoRes | null = null;
        let videoMat: THREE.MeshBasicMaterial | null = null;
        let videoMesh: THREE.Mesh | null = null;
        const url = item.videoUrl || DEFAULT_VIDEO;
        if (url) {
          res = getVideo(url);
          videoMat = new THREE.MeshBasicMaterial({
            map: res.texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
          });
          materials.push(videoMat);
          videoMesh = new THREE.Mesh(geo, videoMat);
          videoMesh.rotation.y = Math.PI;
          videoMesh.position.z = -0.006;
          videoMesh.renderOrder = 2;
          videoMesh.visible = false;
          flip.add(videoMesh);
        }

        // text + button layer, always on top of the video
        const overlay = new THREE.Mesh(geo, overlayMat);
        overlay.rotation.y = Math.PI;
        overlay.position.z = -0.009;
        overlay.renderOrder = 3;
        flip.add(overlay);

        group.userData.cardIndex = i;
        group.visible = false;
        scene.add(group);
        cards.push({
          group,
          flip,
          tilt: tilts[i % tilts.length],
          i,
          hover: 0,
          hoverTarget: 0,
          flipT: 0,
          res,
          videoMat,
          videoMesh,
          videoOn: false,
          videoAlpha: 0,
        });
      });

      /* ---------- Responsive layout: a row on desktop, 3 + 2 grid on portrait ---------- */
      const L = { vh: 1, vw: 1, scale: 1, cw: 1, ch: 1, row: [] as { x: number; y: number }[] };
      const layout = () => {
        const w = stage.clientWidth || window.innerWidth;
        const h = stage.clientHeight || window.innerHeight;
        const aspect = w / h;
        renderer.setSize(w, h, false);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();

        const vh = viewHeightAtZero();
        const vw = vh * aspect;
        const n = data.length;
        const portrait = aspect < 0.95;
        const gapR = 0.16;
        const topCount = Math.min(3, n);
        const bottomCount = n - topCount;

        let cw: number;
        if (!portrait) cw = Math.min((vw * 0.9) / (n + (n - 1) * gapR), (vh * 0.52) / CARD_H);
        else cw = Math.min((vw * 0.9) / (3 + 2 * gapR), (vh * 0.27) / CARD_H);

        const gap = cw * gapR;
        const ch = cw * CARD_H;
        L.vh = vh;
        L.vw = vw;
        L.cw = cw;
        L.ch = ch;
        L.scale = cw / CARD_W;
        L.row = [];
        for (let i = 0; i < n; i++) {
          if (!portrait) {
            L.row.push({ x: (i - (n - 1) / 2) * (cw + gap), y: 0 });
          } else {
            const top = i < topCount;
            const col = top ? i : i - topCount;
            const count = top ? topCount : bottomCount;
            L.row.push({ x: (col - (count - 1) / 2) * (cw + gap), y: top ? (ch + gap) / 2 : -(ch + gap) / 2 });
          }
        }
      };

      /* ---------- Per-frame update from scroll progress ---------- */
      const bgA = new THREE.Color(C.bgStart);
      const bgB = new THREE.Color(C.bgEnd);
      const bgTmp = new THREE.Color();

      const update = (p: number, dt: number) => {
        bgTmp.copy(bgA).lerp(bgB, easeOut(seg(p, T.bg[0], T.bg[1])));
        stage.style.backgroundColor = `#${bgTmp.getHexString()}`;

        const introFade = 1 - seg(p, 0.06, 0.2);
        introEl.style.opacity = String(introFade);
        introEl.style.transform = `translate(-50%, calc(-50% - ${(1 - introFade) * 40}px))`;
        hintEl.style.opacity = String(1 - seg(p, 0, 0.05));
        const capT = easeOut(seg(p, T.caption[0], T.caption[1]));
        captionEl.style.opacity = String(capT);
        captionEl.style.transform = `translateY(${(1 - capT) * 16}px)`;

        const spreadT = easeInOut(seg(p, T.spread[0], T.spread[1]));
        const n = data.length;

        cards.forEach((card) => {
          const { group, flip, tilt, i } = card;
          const mid = i - (n - 1) / 2;

          // 1) DROP: card falls from above into a fanned stack
          const dropStart = T.drop.start + i * T.drop.stagger;
          const dropT = seg(p, dropStart, dropStart + T.drop.dur);
          const dropE = easeOutBack(dropT);
          const stack = { x: mid * L.cw * 0.28, y: 0, rz: mid * 0.07 };
          const startY = L.vh * 0.9 + L.ch;

          // 2) SPREAD: the stack opens into the final row / grid
          const row = L.row[i];
          const x = lerp(stack.x, row.x, spreadT);
          let y = lerp(stack.y, row.y, spreadT);
          y = lerp(startY, y, dropE);
          const rz = lerp(stack.rz, tilt, spreadT);

          // 3) FLIP: each card turns over, with a little lift and wobble
          const flipStart = T.flip.start + i * T.flip.stagger;
          const fT = seg(p, flipStart, flipStart + T.flip.dur);
          const fE = easeInOut(fT);
          flip.rotation.y = Math.PI * fE;
          const lift = Math.sin(fE * Math.PI);
          const wobble = lift * 0.06 * (i % 2 ? 1 : -1);
          card.flipT = fT;

          // 4) VIDEO: starts once the flip has (almost) finished, stops if you scroll back up
          if (fT >= VIDEO_START_AT) card.videoOn = true;
          else if (fT < VIDEO_START_AT - 0.1) card.videoOn = false;

          if (card.res && card.videoMat && card.videoMesh) {
            const v = card.res.video;
            const showing = card.videoOn && !card.res.failed && v.readyState >= 2 && (!v.paused || v.ended);
            card.videoAlpha = THREE.MathUtils.damp(card.videoAlpha, showing ? 1 : 0, 10, dt);
            card.videoMat.opacity = card.videoAlpha;
            card.videoMesh.visible = card.videoAlpha > 0.01;
          }

          card.hover = THREE.MathUtils.damp(card.hover, card.hoverTarget, 12, dt);

          group.position.set(x, y, lift * 0.9 + card.hover * 0.5 + i * 0.002);
          group.rotation.z = rz * (1 - fE) + wobble;
          group.scale.setScalar(L.scale * (1 + 0.05 * card.hover));
          group.visible = dropT > 0;
        });

        // start / stop each shared video depending on whether any card using it is flipped
        const now = performance.now();
        videoRes.forEach((res) => {
          const v = res.video;
          const wanted = !res.failed && cards.some((c) => c.res === res && c.videoOn);
          if (wanted && !res.requested && now >= res.retryAt) {
            res.requested = true;
            v.play().catch((err: unknown) => {
              res.requested = false;
              const name = err instanceof DOMException ? err.name : "";
              if (name === "AbortError") return;
              if (name === "NotSupportedError") res.failed = true;
              else res.retryAt = performance.now() + 1500;
            });
          } else if (!wanted && res.requested) {
            res.requested = false;
            v.pause();
            v.currentTime = 0;
          }
        });
      };

      /* ---------- Scroll progress, measured against this section only ---------- */
      let target = 0;
      let current = 0;
      const readScroll = () => {
        const rect = track.getBoundingClientRect();
        const scrollable = rect.height - stage.clientHeight;
        target = scrollable > 0 ? clamp(-rect.top / scrollable) : 0;
      };

      /* ---------- Hover + click (only on cards that have finished flipping) ---------- */
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const pickCard = (clientX: number, clientY: number): CardObj | null => {
        const r = canvas.getBoundingClientRect();
        ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(
          cards.map((c) => c.group),
          true
        );
        for (const hit of hits) {
          let o: THREE.Object3D | null = hit.object;
          while (o && o.userData.cardIndex === undefined) o = o.parent;
          if (o) {
            const card = cards[o.userData.cardIndex as number];
            if (card.flipT > 0.9) return card;
          }
        }
        return null;
      };

      let hovered: CardObj | null = null;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch") return;
        const c = pickCard(e.clientX, e.clientY);
        if (c === hovered) return;
        if (hovered) hovered.hoverTarget = 0;
        if (c) c.hoverTarget = 1;
        hovered = c;
        canvas.style.cursor = c ? "pointer" : "default";
      };
      const onLeave = () => {
        if (hovered) hovered.hoverTarget = 0;
        hovered = null;
        canvas.style.cursor = "default";
      };
      const onClick = (e: MouseEvent) => {
        const c = pickCard(e.clientX, e.clientY);
        if (c) router.push(`/${data[c.i].slug}`);
      };
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("click", onClick);

      /* ---------- Loop (paused while the section is off-screen) ---------- */
      let visible = true;
      let raf = 0;
      let last = performance.now();
      const frame = (now: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible) {
          last = now;
          return;
        }
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;
        current = THREE.MathUtils.damp(current, target, 8, dt);
        if (Math.abs(target - current) < 0.0001) current = target;
        update(current, dt);
        renderer.render(scene, camera);
      };

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) {
            readScroll();
          } else {
            videoRes.forEach((res) => {
              if (res.requested) {
                res.requested = false;
                res.video.pause();
              }
            });
          }
        },
        { rootMargin: "100px" }
      );
      io.observe(track);
      const ro = new ResizeObserver(() => {
        layout();
        readScroll();
      });
      ro.observe(stage);
      window.addEventListener("scroll", readScroll, { passive: true });

      layout();
      readScroll();
      current = target;
      update(current, 0);
      raf = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", readScroll);
        io.disconnect();
        ro.disconnect();
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("click", onClick);
        geo.dispose();
        videoRes.forEach((res) => {
          res.video.pause();
          res.video.removeAttribute("src");
          res.video.load();
        });
        textures.forEach((t) => t.dispose());
        materials.forEach((m) => m.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      };
    };

    // Wait for the site font so the canvas text uses it, but never block for long.
    const font = getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
    const fontsReady = Promise.all([
      document.fonts.load(`600 64px ${font}`),
      document.fonts.load(`500 28px ${font}`),
      document.fonts.load(`400 30px ${font}`),
    ]).catch(() => undefined);
    Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 1500))]).then(() => {
      if (!disposed) cleanup = start(font);
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [categories, router]);

  return (
    <section id="categories" ref={trackRef} className="relative" style={{ height: `${TRACK_VH}vh`, background: C.bgStart }}>
      {/* soft blend from the hero's bottom edge into this section (sits under the hero's text, over its background) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-[5]"
        style={{ top: -FADE_PX, height: FADE_PX, background: `linear-gradient(to bottom, transparent, ${C.bgStart})` }}
      />

      <div ref={stageRef} className="sticky top-0 h-screen w-full overflow-hidden" style={{ backgroundColor: C.bgStart }}>
        <div ref={mountRef} className="absolute inset-0" />

        <h2
          ref={introRef}
          className="pointer-events-none absolute left-1/2 top-1/2 w-[min(90vw,900px)] text-center font-medium leading-[1.02] tracking-tight text-[clamp(34px,6vw,84px)]"
          style={{ color: C.introText, transform: "translate(-50%, -50%)" }}
        >
          Keep scrolling to
          <br />
          explore categories
        </h2>

        <p
          ref={captionRef}
          className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-sm"
          style={{ color: C.captionText, opacity: 0 }}
        >
          Click a card to open its guides
        </p>

        <div
          ref={hintRef}
          className="pointer-events-none absolute inset-x-0 bottom-7 text-center text-[13px] uppercase tracking-[0.18em]"
          style={{ color: C.hintText }}
        >
          Scroll ↓
        </div>
      </div>

      {/* keyboard / screen-reader / no-WebGL fallback */}
      <ul className="sr-only">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/${c.slug}`}>{c.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
