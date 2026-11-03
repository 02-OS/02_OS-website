// Same geometry and timing as the 02_OS Zero Portal. The 2 slides behind the
// tall 0, the 0 grows in place, then the white veil opens through that oval.
const DURATION_SECONDS = 2.6;
const ZERO = [["M", 0.6484, -266.1914], ["C", -73.6602, -266.1914, -131.3516, -210.0391, -131.3516, -134.6328], ["L", -131.3516, 146.5156], ["C", -131.3516, 210.2656, -82.8047, 258.7734, -18.8984, 258.7734], ["L", 20.1914, 258.7734], ["C", 84.0977, 258.7734, 132.6484, 210.2656, 132.6484, 146.5156], ["L", 132.6484, -134.6328], ["C", 132.6484, -210.0391, 74.957, -266.1914, 0.6484, -266.1914], ["Z"]];
const TWO = [["M", -4.1094, -133.4727], ["C", -5.3008, -217.668, 66.3789, -283.5312, 156.9609, -282.4844], ["C", 250.2383, -285.3164, 320.3008, -217.1797, 318.5039, -129.3789], ["C", 319.4336, -81.7344, 303.0703, -45.2812, 270.8047, -12.5312], ["L", 41.5312, 227.3477], ["C", 36.0586, 233.0938, 36.3555, 238.1719, 42.418, 242.5781], ["L", 300.0469, 242.668], ["C", 309.043, 242.668, 316.332, 249.6055, 316.332, 258.1602], ["C", 316.332, 267.043, 309.0977, 274.2461, 300.1719, 274.2461], ["L", -150.0, 274.1406], ["L", -149.9492, 242.2344], ["L", -79.5664, 247.4297], ["C", -40.3242, 253.918, -7.6016, 235.0078, 10.793, 213.125], ["L", 248.375, -34.8867], ["C", 273.8555, -60.418, 287.4141, -90.7891, 286.7188, -129.6445], ["C", 288.8711, -198.5, 232.4844, -253.4727, 157.1836, -250.4609], ["C", 83.8594, -250.9688, 25.7344, -199.2812, 27.1172, -132.7148], ["C", 27.1172, -124.0898, 20.125, -117.1016, 11.5039, -117.1016], ["C", 2.8789, -117.1016, -4.1094, -124.0898, -4.1094, -133.4727], ["Z"]];
const LOGO_INK = [[-280, 280, 300, -280], [[0, 0, 140, 248], [1, 0, 215, 254]]];
const LOGO_STROKE_WIDTH = 32.1995;

function smooth(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function mix(from, to, amount) {
  return from + (to - from) * amount;
}

function drawPath(ctx, commands) {
  for (const [command, ...values] of commands) {
    if (command === "M") ctx.moveTo(values[0], values[1]);
    else if (command === "C") ctx.bezierCurveTo(...values);
    else if (command === "Z") ctx.closePath();
    else ctx.lineTo(values[0], values[1]);
  }
}

function zeroPath(ctx) {
  drawPath(ctx, ZERO);
}

function setLogoInk(ctx, alpha, grow = 1, shiftX = 0) {
  const [x1, y1, x2, y2] = LOGO_INK[0];
  const ink = ctx.createLinearGradient(
    (x1 - shiftX) / grow, y1 / grow,
    (x2 - shiftX) / grow, y2 / grow,
  );
  for (const [offset, r, g, b] of LOGO_INK[1]) {
    ink.addColorStop(offset, `rgba(${r}, ${g}, ${b}, ${alpha})`);
  }
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
}

function drawTwo(ctx, slide) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(-170, -2000, 10170, 4000);
  ctx.clip();
  ctx.beginPath();
  ctx.rect(-10000, -10000, 20000, 20000);
  ctx.save();
  ctx.translate(-170, 0);
  zeroPath(ctx);
  ctx.restore();
  ctx.clip("evenodd");
  ctx.translate(-500 * slide, 0);
  setLogoInk(ctx, 1);
  ctx.beginPath();
  drawPath(ctx, TWO);
  ctx.fill();
  ctx.restore();
}

function drawPortalFrame(ctx, width, height, elapsed) {
  ctx.clearRect(0, 0, width, height);
  if (elapsed >= DURATION_SECONDS) return;

  const canvasWidth = Math.max(1, Math.floor(Math.min(width * 0.4, height * 0.66 * 512 / 448)));
  const scale = canvasWidth * 0.59375 / 680;
  const originX = -170;
  const originY = -4;
  const x = originX * scale + width / 2;
  const y = height / 2 + originY * scale;
  const halfWidth = 132;
  const expand = elapsed < 0.95 ? 0 : smooth((elapsed - 0.95) / 1.65);
  let cover = 1;
  for (const px of [0, width]) {
    for (const py of [0, height]) {
      const dx = (px - x) / scale;
      const dy = (py - y) / scale;
      const clamped = Math.max(-130, Math.min(130, dy));
      cover = Math.max(cover, Math.hypot(dx, dy - clamped) / halfWidth);
    }
  }
  const grow = mix(1, cover + LOGO_STROKE_WIDTH / halfWidth, expand);
  const open = elapsed < 1.1 ? 0 : smooth((elapsed - 1.1) / 0.9);
  const innerGrow = Math.max(0, (grow - LOGO_STROKE_WIDTH / 2 / halfWidth) * open);
  const veil = expand < 0.72 ? 1 : 1 - smooth((expand - 0.72) / 0.28);

  ctx.beginPath();
  ctx.rect(0, 0, width, height);
  if (innerGrow > 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale * innerGrow, scale * innerGrow);
    ctx.translate(0, -originY);
    zeroPath(ctx);
    ctx.restore();
  }
  ctx.fillStyle = `rgba(255, 255, 255, ${veil})`;
  ctx.fill("evenodd");

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale, scale);
  ctx.lineWidth = LOGO_STROKE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (elapsed < 0.95) drawTwo(ctx, smooth((elapsed - 0.15) / 0.8));

  ctx.translate(originX, 0);
  ctx.translate(0, originY);
  ctx.scale(grow, grow);
  ctx.translate(0, -originY);
  ctx.lineWidth = LOGO_STROKE_WIDTH / grow;
  const inkAlpha = expand > 0.55 ? 1 - smooth((expand - 0.55) / 0.45) : 1;
  setLogoInk(ctx, inkAlpha, grow, originX);
  ctx.beginPath();
  zeroPath(ctx);
  ctx.stroke();
  ctx.restore();
}

function playPortal(overlay) {
  const canvas = overlay.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const start = performance.now();

  function size() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [width, height];
  }

  let view = size();
  const onResize = () => {
    view = size();
  };
  window.addEventListener("resize", onResize);

  drawPortalFrame(ctx, view[0], view[1], 0);
  overlay.style.background = "transparent";

  function frame(now) {
    const elapsed = (now - start) / 1000;
    drawPortalFrame(ctx, view[0], view[1], elapsed);
    if (elapsed >= DURATION_SECONDS) {
      window.removeEventListener("resize", onResize);
      overlay.remove();
      return;
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

const overlay = document.querySelector("#portal");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!overlay || reduce) overlay?.remove();
else playPortal(overlay);

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-replay-portal]");
  if (!trigger || document.querySelector("#portal")) return;
  event.preventDefault();
  const fresh = document.createElement("div");
  fresh.id = "portal";
  fresh.setAttribute("aria-hidden", "true");
  fresh.appendChild(document.createElement("canvas"));
  document.body.appendChild(fresh);
  playPortal(fresh);
});
