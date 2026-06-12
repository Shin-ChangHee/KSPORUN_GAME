/**
 * obstacles.js — 장애물(극복 대상) & 경영방침 코인
 * 무대별 디테일 형태: 1=육상 허들, 2=라바콘, 3=부표.
 * 키워드 라벨(안일/무기력/비효율/은폐)을 경고 태그로 표기.
 */
function rrPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

class Obstacle {
  constructor(game, opts) {
    this.game = game;
    opts = opts || {};
    const s = game.scale || 1;
    this.kind = opts.kind || 'ground';
    this.keyword = CONFIG.OBSTACLE_KEYWORDS[
      Math.floor(Math.random() * CONFIG.OBSTACLE_KEYWORDS.length)
    ];
    this.dead = false;
    this.t = Math.random() * Math.PI * 2;   // 날갯짓 위상
    if (this.kind === 'bird') {
      this.w = (50 + Math.random() * 16) * s;
      this.h = (32 + Math.random() * 8) * s;
      const floatGap = (20 + Math.random() * 26) * s;  // 지면에서 살짝 떠서 점프로 회피
      this.x = game.width + 20 * s;
      this.y = game.groundY - floatGap - this.h;
    } else {
      this.w = (38 + Math.random() * 26) * s;
      this.h = (46 + Math.random() * 40) * s;
      this.x = game.width + 20 * s;
      this.y = game.groundY - this.h;
    }
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.t += dt * 12;
    if (this.x + this.w < -40) this.dead = true;
  }

  getHitbox() {
    if (this.kind === 'bird') {
      const px = this.w * 0.16, py = this.h * 0.18;
      return { x: this.x + px, y: this.y + py, w: this.w - px * 2, h: this.h - py * 2 };
    }
    const padX = this.w * 0.14;
    return { x: this.x + padX, y: this.y, w: this.w - padX * 2, h: this.h };
  }

  draw(ctx) {
    const stageId = this.game.stage.id;
    ctx.save();
    ctx.lineJoin = 'round';
    if (this.kind === 'bird') {
      this._drawBird(ctx);
    } else {
      this._shadow(ctx);
      if (stageId === 3) this._drawBuoy(ctx);
      else if (stageId === 2) this._drawCone(ctx);
      else this._drawHurdle(ctx);
    }
    this._drawLabel(ctx);
    ctx.restore();
  }

  _o() { return Math.max(1.5, 3 * (this.game.scale || 1)); }

  _shadow(ctx) {
    const gy = this.y + this.h, cx = this.x + this.w / 2, s = this.game.scale || 1;
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.beginPath();
    ctx.ellipse(cx, gy + 3 * s, this.w * 0.55, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawHurdle(ctx) {
    const C = CONFIG.COLORS, o = this._o();
    const x = this.x, w = this.w, h = this.h, gy = this.y + this.h, cx = x + w / 2;
    const topy = gy - h * 0.78, legw = Math.max(2, o * 0.8);
    ctx.lineCap = 'round';
    // A형 다리
    for (const sx of [-1, 1]) {
      const tx = cx + sx * w * 0.18, bx = cx + sx * w * 0.46;
      ctx.strokeStyle = C.INK; ctx.lineWidth = legw + o;
      ctx.beginPath(); ctx.moveTo(tx, topy); ctx.lineTo(bx, gy); ctx.stroke();
      ctx.strokeStyle = C.WHITE; ctx.lineWidth = legw;
      ctx.beginPath(); ctx.moveTo(tx, topy); ctx.lineTo(bx, gy); ctx.stroke();
    }
    // 중간 지지바
    ctx.strokeStyle = C.INK; ctx.lineWidth = legw + o;
    ctx.beginPath(); ctx.moveTo(cx - w * 0.3, gy - h * 0.4); ctx.lineTo(cx + w * 0.3, gy - h * 0.4); ctx.stroke();
    ctx.strokeStyle = C.WHITE; ctx.lineWidth = legw;
    ctx.beginPath(); ctx.moveTo(cx - w * 0.3, gy - h * 0.4); ctx.lineTo(cx + w * 0.3, gy - h * 0.4); ctx.stroke();
    // 상단 위험 줄무늬 바
    const by0 = this.y, bh = h * 0.26, bx0 = cx - w * 0.5;
    rrPath(ctx, bx0, by0, w, bh, bh * 0.4); ctx.fillStyle = C.ORANGE; ctx.fill();
    ctx.save();
    rrPath(ctx, bx0, by0, w, bh, bh * 0.4); ctx.clip();
    ctx.fillStyle = C.WHITE;
    for (let i = -1; i < 5; i++) {
      const xx = bx0 + i * w * 0.26;
      ctx.beginPath();
      ctx.moveTo(xx, by0); ctx.lineTo(xx + w * 0.12, by0);
      ctx.lineTo(xx + w * 0.12 - bh, by0 + bh); ctx.lineTo(xx - bh, by0 + bh);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    rrPath(ctx, bx0, by0, w, bh, bh * 0.4); ctx.lineWidth = o; ctx.strokeStyle = C.INK; ctx.stroke();
  }

  _drawCone(ctx) {
    const C = CONFIG.COLORS, o = this._o();
    const x = this.x, w = this.w, h = this.h, gy = this.y + this.h, cx = x + w / 2;
    // 받침
    rrPath(ctx, cx - w * 0.5, gy - h * 0.14, w, h * 0.14, h * 0.05);
    ctx.fillStyle = '#3a3a3a'; ctx.fill(); ctx.lineWidth = o; ctx.strokeStyle = C.INK; ctx.stroke();
    const top = [cx, this.y], bl = [cx - w * 0.34, gy - h * 0.14], br = [cx + w * 0.34, gy - h * 0.14];
    const tri = (p) => { ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(p[0][0], p[0][1]); ctx.lineTo(p[1][0], p[1][1]); ctx.closePath(); };
    tri([br, bl]); ctx.fillStyle = C.ORANGE; ctx.fill();
    tri([br, [cx + w * 0.1, gy - h * 0.14]]); ctx.fillStyle = '#D66000'; ctx.fill();  // 우측 음영
    // 흰 반사 밴드
    ctx.fillStyle = C.WHITE;
    for (const [yy, ww] of [[gy - h * 0.55, 0.2], [gy - h * 0.38, 0.27]]) {
      ctx.beginPath();
      ctx.moveTo(cx - w * ww, yy); ctx.lineTo(cx + w * ww, yy);
      ctx.lineTo(cx + w * (ww + 0.05), yy + h * 0.1); ctx.lineTo(cx - w * (ww + 0.05), yy + h * 0.1);
      ctx.closePath(); ctx.fill();
    }
    tri([br, bl]); ctx.lineWidth = o; ctx.strokeStyle = C.INK; ctx.stroke();
  }

  _drawBuoy(ctx) {
    const C = CONFIG.COLORS, o = this._o();
    const x = this.x, w = this.w, h = this.h, gy = this.y + this.h, cx = x + w / 2;
    // 물결
    ctx.strokeStyle = C.SKYBLUE; ctx.lineWidth = Math.max(2, o - 1);
    for (const yy of [gy - 1, gy + 5 * (this.game.scale || 1)]) {
      ctx.beginPath(); ctx.arc(cx, yy, w * 0.5, Math.PI, Math.PI * 2); ctx.stroke();
    }
    const cyb = gy - h * 0.42, rb = w * 0.4;
    ctx.beginPath(); ctx.arc(cx, cyb, rb, 0, Math.PI * 2);
    ctx.fillStyle = '#E03B3B'; ctx.fill(); ctx.lineWidth = o; ctx.strokeStyle = C.INK; ctx.stroke();
    ctx.fillStyle = C.WHITE; ctx.fillRect(cx - rb, cyb - rb * 0.18, rb * 2, rb * 0.36);
    ctx.beginPath(); ctx.arc(cx, cyb, rb, 0, Math.PI * 2); ctx.stroke();
    // 하이라이트
    ctx.fillStyle = 'rgba(255,150,150,0.95)';
    ctx.beginPath(); ctx.ellipse(cx - rb * 0.35, cyb - rb * 0.45, rb * 0.25, rb * 0.32, 0, 0, Math.PI * 2); ctx.fill();
    // 기둥 + 등
    ctx.strokeStyle = C.INK; ctx.lineWidth = Math.max(2.5, o);
    ctx.beginPath(); ctx.moveTo(cx, cyb - rb); ctx.lineTo(cx, this.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, this.y + w * 0.08, w * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = C.ORANGE; ctx.fill(); ctx.lineWidth = o; ctx.stroke();
  }

  _wing(ctx, px, py, len, ang, fill, o) {
    ctx.save();
    ctx.translate(px, py); ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -len * 0.20, len, len * 0.02);
    ctx.quadraticCurveTo(len * 0.5, len * 0.30, 0, 0);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = o; ctx.strokeStyle = CONFIG.COLORS.INK; ctx.stroke();
    ctx.restore();
  }

  // 날아오는 새 (왼쪽=진행 방향을 향함, 날갯짓 애니메이션)
  _drawBird(ctx) {
    const C = CONFIG.COLORS, s = this.game.scale || 1, o = Math.max(1.5, 2.4 * s);
    const x = this.x, y = this.y, w = this.w, h = this.h, cx = x + w / 2, cy = y + h * 0.5;
    const flap = Math.sin(this.t) * 0.6;
    ctx.lineCap = 'round';
    // 뒤쪽 날개(살짝 어둡게)
    this._wing(ctx, cx + w * 0.04, cy - h * 0.05, w * 0.5, -0.5 + flap * 0.8, '#DCE7F0', o);
    // 몸통
    ctx.beginPath(); ctx.ellipse(cx, cy, w * 0.34, h * 0.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = C.WHITE; ctx.fill(); ctx.lineWidth = o; ctx.strokeStyle = C.INK; ctx.stroke();
    // 꼬리(오른쪽)
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.26, cy); ctx.lineTo(cx + w * 0.5, cy - h * 0.18); ctx.lineTo(cx + w * 0.5, cy + h * 0.14);
    ctx.closePath(); ctx.fillStyle = C.WHITE; ctx.fill(); ctx.stroke();
    // 머리(왼쪽 앞)
    const hx = cx - w * 0.26, hy = cy - h * 0.06, hr = h * 0.32;
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fillStyle = C.WHITE; ctx.fill(); ctx.stroke();
    // 부리(오렌지)
    ctx.beginPath();
    ctx.moveTo(hx - hr * 0.65, hy - hr * 0.05); ctx.lineTo(hx - hr * 1.5, hy - hr * 0.16); ctx.lineTo(hx - hr * 0.6, hy + hr * 0.3);
    ctx.closePath(); ctx.fillStyle = C.ORANGE; ctx.fill(); ctx.lineWidth = o * 0.8; ctx.stroke();
    // 눈
    ctx.beginPath(); ctx.arc(hx - hr * 0.12, hy - hr * 0.18, Math.max(1.2, o * 0.7), 0, Math.PI * 2);
    ctx.fillStyle = C.INK; ctx.fill();
    // 앞쪽 날개(흰색, 펄럭)
    this._wing(ctx, cx - w * 0.02, cy - h * 0.10, w * 0.55, -0.7 + flap, C.WHITE, o);
  }

  _drawLabel(ctx) {
    const C = CONFIG.COLORS, s = this.game.scale || 1;
    // 글자는 화면이 작아도 잘 보이도록 덜 줄임(클램프) + 기본 크기 확대
    const ls = Math.max(0.95, Math.min(1.4, s));
    const fs = Math.round(17 * ls);
    ctx.font = `bold ${fs}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    const tx = this.x + this.w / 2, ty = this.y - 10 * s;
    const tw = ctx.measureText(this.keyword).width + 16;
    const rh = fs + 9, rx = tx - tw / 2, ry = ty - rh + 3;
    rrPath(ctx, rx, ry, tw, rh, 7); ctx.fillStyle = 'rgba(26,26,26,0.85)'; ctx.fill();
    ctx.lineWidth = Math.max(1.5, 2 * ls); ctx.strokeStyle = C.ORANGE; ctx.stroke();
    ctx.fillStyle = C.WHITE; ctx.textBaseline = 'middle';
    ctx.fillText(this.keyword, tx, ry + rh / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }
}

/**
 * 경영방침 코인 (존중·조화·정정당당). 점프로 획득 시 보너스 점수 + 이펙트.
 * 코인 베이스는 얼굴 아이콘.
 */
class Coin {
  constructor(game, x) {
    this.game = game;
    const s = game.scale || 1;
    this.r = 20 * s;
    this.x = x;
    // 공중에 떠 있어 점프로 획득
    this.y = game.groundY - this.r - (70 + Math.random() * 90) * s;
    this.keyword = CONFIG.COIN_KEYWORDS[
      Math.floor(Math.random() * CONFIG.COIN_KEYWORDS.length)
    ];
    this.dead = false;
    this.t = Math.random() * Math.PI * 2;
  }

  update(dt, speed) {
    this.x -= speed * dt;
    this.t += dt * 4;
    if (this.x + this.r < -40) this.dead = true;
  }

  getHitbox() {
    return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 };
  }

  draw(ctx) {
    const face = this.game.assets['icon_face'];
    const C = CONFIG.COLORS, s = this.game.scale || 1;
    const bob = Math.sin(this.t) * 4 * s;
    const cy = this.y + bob, r = this.r;
    const shine = 0.5 + 0.5 * Math.sin(this.t * 1.5); // 반짝임 펄스
    ctx.save();

    // 글로우
    ctx.globalAlpha = 0.35 + shine * 0.25;
    ctx.beginPath(); ctx.arc(this.x, cy, r * 1.35, 0, Math.PI * 2);
    ctx.fillStyle = '#FFCB8A'; ctx.fill();
    ctx.globalAlpha = 1;

    // 바깥 링 + 톱니(노치)
    ctx.beginPath(); ctx.arc(this.x, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = C.ORANGE; ctx.fill();
    ctx.lineWidth = Math.max(2, 2.5 * s); ctx.strokeStyle = C.INK; ctx.stroke();
    ctx.strokeStyle = '#D66000'; ctx.lineWidth = Math.max(1.5, 2 * s);
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(this.x + Math.cos(a) * r * 0.84, cy + Math.sin(a) * r * 0.84);
      ctx.lineTo(this.x + Math.cos(a) * r * 0.98, cy + Math.sin(a) * r * 0.98);
      ctx.stroke();
    }

    // 안쪽 흰 디스크 + 얼굴
    ctx.beginPath(); ctx.arc(this.x, cy, r * 0.72, 0, Math.PI * 2);
    ctx.fillStyle = C.WHITE; ctx.fill();
    ctx.lineWidth = Math.max(1.5, 2 * s); ctx.strokeStyle = '#D66000'; ctx.stroke();
    if (face && face.complete) {
      ctx.save();
      ctx.beginPath(); ctx.arc(this.x, cy, r * 0.68, 0, Math.PI * 2); ctx.clip();
      const ratio = face.naturalWidth / face.naturalHeight;
      const fh = r * 1.5, fw = fh * ratio;
      ctx.drawImage(face, this.x - fw / 2, cy - fh / 2, fw, fh);
      ctx.restore();
    }
    // 반짝임 글린트
    ctx.globalAlpha = 0.5 + shine * 0.5;
    ctx.fillStyle = C.WHITE;
    ctx.beginPath(); ctx.ellipse(this.x - r * 0.4, cy - r * 0.5, r * 0.16, r * 0.26, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // 키워드 배너 (작은 화면에서도 잘 보이도록 클램프 + 확대)
    const ls = Math.max(0.95, Math.min(1.4, s));
    const fs = Math.round(15 * ls);
    ctx.font = `bold ${fs}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    const tw = ctx.measureText(this.keyword).width + 16;
    const bh = fs + 8, by = cy + r + 4 * s;
    rrPath(ctx, this.x - tw / 2, by, tw, bh, 6); ctx.fillStyle = C.BLUE; ctx.fill();
    ctx.fillStyle = C.WHITE; ctx.textBaseline = 'middle';
    ctx.fillText(this.keyword, this.x, by + bh / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
}
