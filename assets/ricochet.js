// The hero's one moving thing: an orb banking off the edges, gaining a carom at each bounce,
// with the game's dotted aim line behind it. Static path only when reduced motion is preferred.
(() => {
  const cv = document.querySelector('.ricochet');
  if (!cv) return;
  const g = cv.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, path = [], total = 0, t0 = performance.now(), visible = true, raf = 0;

  function build() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    // trace a bank shot inside the hero box
    const m = 14;
    let x = W * 0.06, y = H - m, a = -Math.PI * 0.31;
    path = [[x, y]];
    for (let b = 0; b < 6; b++) {
      const dx = Math.cos(a), dy = Math.sin(a);
      const tx = dx > 0 ? (W - m - x) / dx : (m - x) / dx;
      const ty = dy > 0 ? (H - m - y) / dy : (m - y) / dy;
      const s = Math.min(tx, ty);
      x += dx * s; y += dy * s;
      path.push([x, y]);
      a = tx < ty ? Math.PI - a : -a;
    }
    total = 0;
    for (let i = 1; i < path.length; i++) total += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  }

  function pointAt(d) {
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i - 1], [bx, by] = path[i];
      const len = Math.hypot(bx - ax, by - ay);
      if (d <= len) return { x: ax + ((bx - ax) * d) / len, y: ay + ((by - ay) * d) / len, seg: i - 1 };
      d -= len;
    }
    const [lx, ly] = path[path.length - 1];
    return { x: lx, y: ly, seg: path.length - 2 };
  }

  function dots(alpha, upTo) {
    g.fillStyle = `rgba(255,207,90,${alpha})`;
    for (let d = 0; d < Math.min(total, upTo); d += 22) { const p = pointAt(d); g.beginPath(); g.arc(p.x, p.y, 2.6, 0, 7); g.fill(); }
  }

  function frame(now) {
    raf = 0;
    g.clearRect(0, 0, W, H);
    if (still) { dots(0.22, total); return; }
    const speed = 340, rest = 1.4; // px/s, seconds of pause between shots
    const cycle = total / speed + rest;
    const tt = ((now - t0) / 1000) % cycle;
    const d = Math.min(total, tt * speed);
    const fade = tt * speed > total ? Math.max(0, 1 - (tt - total / speed) / rest) : 1;
    dots(0.16 * fade, total);
    dots(0.4 * fade, d);
    const p = pointAt(d);
    // bounce flashes and carom counts behind the orb
    g.font = "800 22px 'Grenze Gotisch', Georgia, serif"; g.textAlign = 'center';
    for (let i = 1; i <= p.seg && i < path.length - 1; i++) {
      const [bx, by] = path[i];
      g.strokeStyle = `rgba(127,240,224,${0.5 * fade})`; g.lineWidth = 2;
      g.beginPath(); g.arc(bx, by, 10, 0, 7); g.stroke();
      g.fillStyle = `rgba(255,207,90,${0.85 * fade})`;
      g.fillText('×' + i, bx + (bx > W / 2 ? -26 : 26), by + (by > H / 2 ? -14 : 28));
    }
    if (fade > 0) {
      const glow = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
      glow.addColorStop(0, `rgba(190,255,247,${0.9 * fade})`); glow.addColorStop(1, 'rgba(127,240,224,0)');
      g.fillStyle = glow; g.beginPath(); g.arc(p.x, p.y, 26, 0, 7); g.fill();
      g.fillStyle = `rgba(255,255,255,${fade})`; g.beginPath(); g.arc(p.x, p.y, 6, 0, 7); g.fill();
    }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }

  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  build(); kick();
  new ResizeObserver(() => { build(); kick(); }).observe(cv);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(cv);
  document.addEventListener('visibilitychange', kick);
  document.fonts?.ready.then(kick);
})();
