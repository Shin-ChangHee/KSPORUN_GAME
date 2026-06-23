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
    const s = (game.scale || 1) * 0.95;   // 장애물 전체 크기 5% 축소
    this.kind = opts.kind || 'ground';
    this.keyword = CONFIG.OBSTACLE_KEYWORDS[
      Math.floor(Math.random() * CONFIG.OBSTACLE_KEYWORDS.length)
    ];
    this.dead = false;
    this.t = Math.random() * Math.PI * 2;   // 날갯짓 위상
    if (this.kind === 'bird') {
      this.w = (50 + Math.random() * 16) * s;
      this.h = (32 + Math.random() * 8) * s;
      // 크롬 공룡게임 익룡처럼 '머리 위 높이' 비행:
      // 가만히 달리면 밑으로 통과, 점프하면 부딪혀 게임오버
      const standH = 110 * s;                       // 플레이어 키 기준
      const clearance = (26 + Math.random() * 18) * s;  // 서 있을 때 머리 위 여유
      const bottom = game.groundY - standH - clearance;
      this.x = game.width + 20 * s;
      this.y = bottom - this.h;
    } else {
      // 바닥 장애물: 일부는 몬스터 스프라이트(점프로 넘을 수 있는 크기)
      this.variant = (Math.random() < CONFIG.MONSTER_CHANCE) ? 'monster' : 'shape';
      if (this.variant === 'monster') {
        // 몬스터 3종 중 랜덤 (key, 가로/세로 비율)
        const MON = [['obstacle_monster', 0.9], ['obstacle_monster2', 0.98], ['obstacle_monster3', 0.95]];
        const m = MON[Math.floor(Math.random() * MON.length)];
        this.monsterKey = m[0];
        this.h = (58 + Math.random() * 16) * s;       // 점프로 넘기 좋은 높이
        this.w = this.h * m[1];
      } else {
        this.w = (38 + Math.random() * 26) * s;
        this.h = (46 + Math.random() * 40) * s;
      }
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
    if (this.variant === 'monster') {
      // 몬스터: 양옆 손이 튀어나와 있어 좌우 여유를 더 줌(억울한 충돌 방지)
      const px = this.w * 0.2, py = this.h * 0.08;
      return { x: this.x + px, y: this.y + py, w: this.w - px * 2, h: this.h - py };
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
    } else if (this.variant === 'monster') {
      this._shadow(ctx);
      this._drawMonster(ctx);
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

  // 바닥 몬스터 장애물 (스프라이트)
  _drawMonster(ctx) {
    const img = this.game.assets[this.monsterKey || 'obstacle_monster'];
    const x = this.x, w = this.w, h = this.h, gy = this.y + this.h, cx = x + w / 2;
    if (img && img.complete && img.naturalWidth) {
      const ratio = img.naturalWidth / img.naturalHeight;
      let dh = h, dw = dh * ratio;
      ctx.drawImage(img, cx - dw / 2, gy - dh, dw, dh);
    } else {
      // 폴백: 보라 사각형
      ctx.fillStyle = '#8E6FB0';
      ctx.fillRect(x, this.y, w, h);
    }
  }

  _drawLabel(ctx) {
    const C = CONFIG.COLORS, s = this.game.scale || 1;
    // 글자는 화면이 작아도 잘 보이도록 덜 줄임(클램프) + 기본 크기 확대
    const ls = Math.max(0.95, Math.min(1.4, s));
    const fs = Math.round(17 * ls);
    ctx.font = `bold ${fs}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    const tx = this.x + this.w / 2;
    const tw = ctx.measureText(this.keyword).width + 16;
    const rh = fs + 9, rx = tx - tw / 2;
    // 새(공중)는 위, 바닥 장애물은 아래(지면 쪽)에 배치
    let ry;
    if (this.kind === 'bird') {
      ry = this.y - 10 * s - rh;           // 새 위
    } else {
      ry = this.y + this.h + 8 * s;        // 장애물 아래(지면 위)
    }
    rrPath(ctx, rx, ry, tw, rh, 7); ctx.fillStyle = 'rgba(26,26,26,0.85)'; ctx.fill();
    ctx.lineWidth = Math.max(1.5, 2 * ls); ctx.strokeStyle = C.ORANGE; ctx.stroke();
    ctx.fillStyle = C.WHITE; ctx.textBaseline = 'middle';
    ctx.fillText(this.keyword, tx, ry + rh / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }
}

// 코인 캐릭터를 골고루(편중 없이) 뽑기 위한 셔플 백 — 5종이 모두 한 번씩 나온 뒤 재셔플
let COIN_BAG = [];
function nextCoinImg() {
  if (COIN_BAG.length === 0) {
    COIN_BAG = [1, 2, 3, 4, 5];
    for (let i = COIN_BAG.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [COIN_BAG[i], COIN_BAG[j]] = [COIN_BAG[j], COIN_BAG[i]];
    }
  }
  return COIN_BAG.pop();
}

/**
 * 수집 코인 — 5종 캐릭터 이미지를 셔플 백으로 골고루 등장. 점프로 획득 시 보너스 점수.
 */
class Coin {
  constructor(game, x) {
    this.game = game;
    const s = game.scale || 1;
    // 코인 크기는 작은 화면(모바일)에서 너무 작아지지 않게 클램프
    const cs = Math.max(0.82, Math.min(1.3, s));
    this.r = 22 * cs;
    this.x = x;
    // 공중에 떠 있어 점프로 획득 (높이는 점프와 같은 raw 스케일 기준)
    this.y = game.groundY - this.r - (70 + Math.random() * 90) * s;
    this.imgIndex = nextCoinImg();   // 1~5 골고루
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
    const C = CONFIG.COLORS, s = this.game.scale || 1;
    const ls = Math.max(0.9, Math.min(1.4, s));
    const bob = Math.sin(this.t) * 4 * s;
    const cy = this.y + bob;
    const img = this.game.assets['coin_char' + this.imgIndex];
    const d = this.r * 2.5;
    if (img && img.complete && img.naturalWidth) {
      ctx.drawImage(img, this.x - d / 2, cy - d / 2, d, d);
    } else {
      ctx.beginPath(); ctx.arc(this.x, cy, this.r, 0, Math.PI * 2);
      ctx.fillStyle = C.ORANGE; ctx.fill();
    }
    // 경영방침 키워드 배너 (존중·조화·정정당당)
    const fs = Math.round(14 * ls);
    ctx.font = `bold ${fs}px "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    const tw = ctx.measureText(this.keyword).width + 16;
    const bh = fs + 8, by = cy + this.r * 1.2 + 2 * s;
    rrPath(ctx, this.x - tw / 2, by, tw, bh, 6); ctx.fillStyle = C.BLUE; ctx.fill();
    ctx.fillStyle = C.WHITE; ctx.textBaseline = 'middle';
    ctx.fillText(this.keyword, this.x, by + bh / 2 + 1);
    ctx.textBaseline = 'alphabetic';
  }
}
