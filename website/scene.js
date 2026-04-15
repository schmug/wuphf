// WUPHF Pixel Office — scene engine
// Loaded by website/index.html. No dependencies.
// See DESIGN.md for the full spec.

(function () {
  'use strict';

  const canvas = document.getElementById('officeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── Canvas sizing ──────────────────────────────────────────────
  const W = 800, H = 460;
  canvas.width  = W;
  canvas.height = H;
  canvas.style.width  = '100%';
  canvas.style.height = 'auto';

  // ── Design tokens ──────────────────────────────────────────────
  const C = {
    bg:         '#1A1610',
    surface:    '#242018',
    surfaceHi:  '#2E2820',
    border:     '#3A3028',
    text:       '#F0EBD8',
    textMuted:  '#8A7D6A',
    yellow:     '#ECB22E',
    yellowDark: '#C49020',
    blue:       '#5A9AC8',
    green:      '#5AAA7A',
    carpet:     '#3A3228',
    carpetAlt:  '#302A20',
    carpetLine: '#2A2418',
    wall:       '#201C14',
    wallLight:  '#2A2418',
    desk:       '#7A5A18',
    deskDark:   '#5A3C08',
    deskSide:   '#3A2404',
    skin:       '#F4C890',
    light:      '#FFFEF0',
    shadow:     'rgba(0,0,0,0.5)',
    plant:      '#3A6028',
  };

  // ── Isometric grid ─────────────────────────────────────────────
  const TW = 60, TH = 30;
  const OX = 420, OY = 100;
  const COLS = 9, ROWS = 6;

  function iso(gx, gy) {
    return {
      x: OX + (gx - gy) * TW / 2,
      y: OY + (gx + gy) * TH / 2,
    };
  }
  function isoCenter(gx, gy) {
    const p = iso(gx, gy);
    return { x: p.x + TW / 2, y: p.y + TH / 2 };
  }

  // ── State ──────────────────────────────────────────────────────
  let flashOn   = true;
  let animF     = 0;
  let drawerHit = null;

  setInterval(() => { flashOn = !flashOn; }, 500);
  setInterval(() => { animF = (animF + 1) % 4; }, 280);

  // ── Floor tile ─────────────────────────────────────────────────
  function drawFloorTile(gx, gy, color) {
    const p = iso(gx, gy);
    ctx.beginPath();
    ctx.moveTo(p.x + TW / 2, p.y);
    ctx.lineTo(p.x + TW,     p.y + TH / 2);
    ctx.lineTo(p.x + TW / 2, p.y + TH);
    ctx.lineTo(p.x,           p.y + TH / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = C.carpetLine;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // ── Iso box (w tiles wide × d tiles deep × h px tall) ─────────
  function drawIsoBox(gx, gy, w, d, h, top, left, right) {
    const p0 = iso(gx,     gy);
    const pw = iso(gx + w, gy);
    const pd = iso(gx,     gy + d);
    const pf = iso(gx + w, gy + d);

    // top face
    ctx.beginPath();
    ctx.moveTo(p0.x + TW/2, p0.y - h);
    ctx.lineTo(pw.x + TW/2, pw.y - h);
    ctx.lineTo(pf.x + TW/2, pf.y - h);
    ctx.lineTo(pd.x + TW/2, pd.y - h);
    ctx.closePath();
    ctx.fillStyle = top; ctx.fill();

    // left face
    ctx.beginPath();
    ctx.moveTo(p0.x + TW/2, p0.y - h);
    ctx.lineTo(pd.x + TW/2, pd.y - h);
    ctx.lineTo(pd.x + TW/2, pd.y);
    ctx.lineTo(p0.x + TW/2, p0.y);
    ctx.closePath();
    ctx.fillStyle = left; ctx.fill();

    // right face
    ctx.beginPath();
    ctx.moveTo(pw.x + TW/2, pw.y - h);
    ctx.lineTo(pf.x + TW/2, pf.y - h);
    ctx.lineTo(pf.x + TW/2, pf.y);
    ctx.lineTo(pw.x + TW/2, pw.y);
    ctx.closePath();
    ctx.fillStyle = right; ctx.fill();
  }

  // ── Back wall ──────────────────────────────────────────────────
  function drawWall() {
    // Back wall base
    ctx.fillStyle = C.wall;
    ctx.fillRect(0, 0, W, OY + 30);

    // Baseboard strip
    ctx.fillStyle = C.wallLight;
    ctx.fillRect(0, OY + 22, W, 6);

    // Fluorescent light fixtures (4 ceiling-mounted)
    for (let i = 0; i < 4; i++) {
      const lx = 60 + i * 170, ly = 6;
      ctx.fillStyle = '#302820';
      ctx.fillRect(lx, ly, 130, 10);
      ctx.fillStyle = 'rgba(255,254,230,0.6)';
      ctx.fillRect(lx + 4, ly + 2, 122, 6);
      const grad = ctx.createLinearGradient(lx + 65, ly + 8, lx + 65, ly + 40);
      grad.addColorStop(0, 'rgba(255,254,220,0.12)');
      grad.addColorStop(1, 'rgba(255,254,220,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(lx, ly + 8, 130, 32);
    }

    // WUPHF sign (dark panel, golden amber letters, amber glow)
    const sx = 250, sy = 26;
    ctx.fillStyle = '#0E0C08';
    ctx.fillRect(sx, sy, 300, 52);
    ctx.fillStyle = C.yellow;
    ctx.fillRect(sx,       sy,      300, 4);
    ctx.fillRect(sx,       sy + 48, 300, 4);
    ctx.fillRect(sx,       sy,      4,   52);
    ctx.fillRect(sx + 296, sy,      4,   52);
    ctx.fillStyle = 'rgba(236,178,46,0.08)';
    ctx.fillRect(sx + 4, sy + 4, 292, 44);
    ctx.shadowColor = C.yellow;
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = C.yellow;
    ctx.font = 'bold 28px "Press Start 2P"';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WUPHF', sx + 150, sy + 28);
    ctx.shadowBlur = 0;
    // sign mounting brackets
    ctx.fillStyle = C.deskDark;
    ctx.fillRect(sx + 40,  sy + 50, 8, 14);
    ctx.fillRect(sx + 252, sy + 50, 8, 14);

    // Wall clock (top-right)
    ctx.fillStyle = C.wallLight;
    ctx.beginPath(); ctx.arc(740, 48, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.surface;
    ctx.beginPath(); ctx.arc(740, 48, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = C.text; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(740, 36); ctx.lineTo(740, 48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(740, 48); ctx.lineTo(750, 53); ctx.stroke();

    // Beet farm map (left side, Dwight's territory)
    const bx = iso(0, 3).x - 65;
    ctx.fillStyle = '#2A2818';
    ctx.fillRect(bx, OY - 22, 50, 38);
    ctx.strokeStyle = '#504830'; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, OY - 22, 50, 38);
    ctx.fillStyle = '#807020';
    ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('BEET', bx + 25, OY - 7);
    ctx.fillText('FARM', bx + 25, OY + 5);
    ctx.fillStyle = '#2A5018';
    ctx.fillRect(bx + 10, OY + 10, 8, 4);
    ctx.fillRect(bx + 30, OY + 8,  8, 4);
    ctx.fillRect(bx + 18, OY + 6,  8, 4);

    // Conference room partition (left corner)
    const cp = iso(0, 0);
    ctx.fillStyle = '#252018';
    ctx.fillRect(cp.x - 40, OY - 2, 40, 30);
    ctx.strokeStyle = C.border; ctx.lineWidth = 1;
    ctx.strokeRect(cp.x - 40, OY - 2, 40, 30);
    ctx.fillStyle   = C.textMuted;
    ctx.font = '5px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('CONF', cp.x - 20, OY + 8);
    ctx.fillText('ROOM', cp.x - 20, OY + 17);
  }

  // ── Furniture ──────────────────────────────────────────────────
  // Returns the hit-testable drawer rect: { drawerX, drawerY }
  function drawDesk(gx, gy, w, flash) {
    const DH = 22;
    drawIsoBox(gx, gy, w, 1, DH, C.desk, C.deskDark, C.deskSide);

    // Monitor
    const p  = iso(gx, gy);
    const mx = p.x + TW * w / 2 + 6;
    const my = p.y - DH - 22;
    ctx.fillStyle = '#1A2030'; ctx.fillRect(mx, my, 28, 18);
    ctx.fillStyle = '#1A3858'; ctx.fillRect(mx + 2, my + 2, 24, 14);
    ctx.fillStyle = C.blue;
    for (let i = 0; i < 3; i++) ctx.fillRect(mx + 4, my + 4 + i * 4, 8 + i * 4, 2);
    ctx.fillStyle = '#1A1820';
    ctx.fillRect(mx + 10, my + 18, 8, 5);
    ctx.fillRect(mx + 6,  my + 22, 16, 3);

    // Drawer (flashes amber when flash=true)
    const dp = iso(gx + w - 1, gy);
    const dx = dp.x + 6;
    const dy = dp.y - DH + 6;
    ctx.fillStyle = (flash && flashOn) ? C.yellow : C.deskDark;
    if (flash && flashOn) { ctx.shadowColor = C.yellow; ctx.shadowBlur = 8; }
    ctx.fillRect(dx, dy, 20, 12);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = (flash && flashOn) ? C.yellow : C.deskSide;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(dx, dy, 20, 12);
    ctx.fillStyle = C.yellow;
    ctx.fillRect(dx + 7, dy + 4, 6, 4);

    // Paper on desk
    const pp = iso(gx, gy);
    ctx.fillStyle = C.surfaceHi; ctx.fillRect(pp.x + 16, pp.y - DH - 2, 16, 12);
    ctx.fillStyle = C.border;
    for (let i = 0; i < 3; i++) ctx.fillRect(pp.x + 18, pp.y - DH + 1 + i * 3, 10, 1);

    return { drawerX: dx, drawerY: dy };
  }

  function drawPlant(gx, gy) {
    const c = isoCenter(gx, gy);
    ctx.fillStyle = '#5A3A18'; ctx.fillRect(c.x - 5, c.y - 14, 10, 10);
    ctx.fillStyle = C.plant;   ctx.fillRect(c.x - 10, c.y - 28, 20, 18);
    ctx.fillStyle = '#2A4818'; ctx.fillRect(c.x - 7,  c.y - 32, 14, 8);
    ctx.fillStyle = C.plant;   ctx.fillRect(c.x - 4,  c.y - 36, 8, 10);
  }

  function drawSnackJar(gx, gy) {
    const c = isoCenter(gx, gy);
    ctx.fillStyle = '#3A5878'; ctx.fillRect(c.x - 6, c.y - 18, 12, 14);
    ctx.fillStyle = C.surface; ctx.fillRect(c.x - 5, c.y - 17, 10, 12);
    ctx.fillStyle = C.yellow;  ctx.fillRect(c.x - 3, c.y - 12, 6, 6);
    ctx.fillStyle = C.deskDark; ctx.fillRect(c.x - 5, c.y - 18, 12, 4);
    ctx.fillStyle = C.text;
    ctx.font = '4px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('NO',    c.x, c.y - 10);
    ctx.fillText('WASTE', c.x, c.y - 6);
  }

  // ── Main draw ──────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawWall();

    // Floor tiles
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < COLS; gx++) {
        drawFloorTile(gx, gy, (gx + gy) % 2 === 0 ? C.carpet : C.carpetAlt);
      }
    }

    // Props
    drawPlant(8, 0);
    drawPlant(8, 2);
    drawSnackJar(5, 4);

    // Desks (back-to-front: lower gx+gy first)
    drawerHit = drawDesk(2, 0, 2, true);  // reception desk — flashing drawer
    drawDesk(0, 3, 1, false);             // Dwight's desk
    drawDesk(2, 3, 1, false);             // Jim's desk
    drawDesk(5, 1, 1, false);             // CEO Agent desk (back right)
    drawDesk(2, 4, 1, false);             // Engineer Agent desk
    drawDesk(4, 3, 1, false);             // CMO Agent desk
  }

  function loop() { draw(); requestAnimationFrame(loop); }
  loop();

})();
