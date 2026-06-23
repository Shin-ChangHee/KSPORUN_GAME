/**
 * stages.js — 무대 배경 렌더링 (패럴랙스: 원경/중경/근경)
 * 무대 정의값은 CONFIG.STAGES, 여기서는 그리기만 담당.
 */
class StageRenderer {
  constructor(game) {
    this.game = game;
    this.scrollFar = 0;
    this.scrollMid = 0;
    this.scrollNear = 0;
  }

  update(dt, speed) {
    this.scrollFar  += speed * 0.15 * dt;
    this.scrollMid  += speed * 0.45 * dt;
    this.scrollNear += speed * 1.0 * dt;
  }

  draw(ctx, stage) {
    const g = this.game;
    const W = g.width, H = g.height, gy = g.groundY;

    // 하늘 그라데이션
    const sky = ctx.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, stage.sky);
    sky.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, gy);

    if (stage.id === 1) this._drawPark(ctx, stage);
    else if (stage.id === 2) this._drawVelodrome(ctx, stage);
    else this._drawWater(ctx, stage);

    // 지면
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, gy, W, H - gy);
    ctx.fillStyle = stage.groundDark;
    ctx.fillRect(0, gy, W, 6);
    // 지면 질감 (근경 스크롤)
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    const step = 60;
    const off = this.scrollNear % step;
    for (let x = -off; x < W; x += step) {
      ctx.fillRect(x, gy + 14, 26, 5);
    }
  }

  _hills(ctx, baseY, amp, color, scroll, period) {
    const W = this.game.width;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY + amp);
    const off = scroll % period;
    for (let x = -off; x <= W + period; x += 4) {
      const y = baseY - Math.sin((x + scroll) / period * Math.PI * 2) * amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, baseY + amp);
    ctx.lineTo(0, baseY + amp);
    ctx.closePath();
    ctx.fill();
  }

  _drawPark(ctx, stage) {
    const g = this.game, gy = g.groundY, W = g.width, s = g.scale || 1;
    // 구름 (원경, 가장 느리게)
    this._clouds(ctx, this.scrollFar * 0.5, s);
    // 세계평화의문 실루엣 (원경)
    const off = this.scrollFar % (W + 220 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const px = W - off;
    ctx.beginPath();
    ctx.moveTo(px, gy);
    ctx.lineTo(px + 30 * s, gy - 130 * s);
    ctx.lineTo(px + 110 * s, gy - 150 * s);
    ctx.lineTo(px + 140 * s, gy);
    ctx.closePath();
    ctx.fill();
    // 나홀로 나무 (중경) — 띄엄띄엄 반복
    const period = W * 0.85 + 280 * s;
    const toff = (this.scrollMid * 0.7) % period;
    for (let x = -toff; x < W + period; x += period) {
      this._loneTree(ctx, x + W * 0.55, gy, s);
    }
    // 잔디 언덕 (중경, 가장 앞)
    this._hills(ctx, gy - 10 * s, 24 * s, 'rgba(94,145,80,0.5)', this.scrollMid, 320 * s);
  }

  _cloud(ctx, x, y, s) {
    ctx.beginPath();
    ctx.arc(x, y, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 22 * s, y - 9 * s, 24 * s, 0, Math.PI * 2);
    ctx.arc(x + 48 * s, y, 18 * s, 0, Math.PI * 2);
    ctx.arc(x + 24 * s, y + 8 * s, 20 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  _clouds(ctx, scroll, s) {
    const W = this.game.width, gy = this.game.groundY;
    const period = W + 320 * s;
    const off = scroll % period;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const [fx, fy] of [[0.16, 0.16], [0.56, 0.1], [0.86, 0.24]]) {
      let x = fx * W - off;
      if (x < -160 * s) x += period;
      this._cloud(ctx, x, fy * gy, s);
    }
  }

  // 올림픽공원 나홀로 나무
  _loneTree(ctx, x, gy, s) {
    const trunkH = 72 * s, trunkW = 15 * s, cR = 46 * s, cy = gy - trunkH - cR * 0.5;
    // 둔덕
    ctx.fillStyle = 'rgba(94,145,80,0.45)';
    ctx.beginPath(); ctx.ellipse(x, gy, 74 * s, 18 * s, 0, 0, Math.PI * 2); ctx.fill();
    // 줄기
    ctx.fillStyle = 'rgba(120,86,58,0.9)';
    ctx.fillRect(x - trunkW / 2, gy - trunkH, trunkW, trunkH);
    // 수관 (둥근 덩어리)
    ctx.fillStyle = 'rgba(86,150,86,0.92)';
    ctx.beginPath(); ctx.arc(x, cy, cR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - cR * 0.62, cy + cR * 0.35, cR * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + cR * 0.62, cy + cR * 0.35, cR * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, cy - cR * 0.5, cR * 0.66, 0, Math.PI * 2); ctx.fill();
    // 그늘
    ctx.fillStyle = 'rgba(60,110,60,0.22)';
    ctx.beginPath(); ctx.arc(x + cR * 0.35, cy + cR * 0.2, cR * 0.55, 0, Math.PI * 2); ctx.fill();
  }

  _drawVelodrome(ctx, stage) {
    const g = this.game, gy = g.groundY, W = g.width, s = g.scale || 1;
    // 구름 (밝은 분위기)
    this._clouds(ctx, this.scrollFar * 0.5, s);
    // 스피돔 경기장 일러스트 (원경) — 띄엄띄엄 반복
    const img = this.game.assets['velodrome'];
    if (img && img.complete && img.naturalWidth) {
      const bw = Math.min(W * 0.58, 520 * s);
      const bh = bw * img.naturalHeight / img.naturalWidth;
      const period = W * 1.25 + 360 * s;
      const off = this.scrollFar % period;
      for (let x = -off; x < W + period; x += period) {
        ctx.drawImage(img, x + W * 0.2, gy - bh, bw, bh);
      }
    }
    // 기울어진 뱅크 라인 (중경, 밝게)
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 3 * s;
    const loff = this.scrollMid % (120 * s);
    for (let x = -loff; x < W; x += 120 * s) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + 60 * s, gy - 40 * s);
      ctx.stroke();
    }
  }

  _drawWater(ctx, stage) {
    const g = this.game, gy = g.groundY, W = g.width, s = g.scale || 1;
    // 구름 + 먼 강 건너 능선 (원경)
    this._clouds(ctx, this.scrollFar * 0.5, s);
    this._hills(ctx, gy - 6 * s, 16 * s, 'rgba(150,180,200,0.4)', this.scrollFar * 1.2, 360 * s);
    // 경기장 조명탑(플러드라이트) (원경) — 여러 개, 높이 다양
    const tperiod = W * 0.46 + 120 * s;
    const toff = this.scrollFar % tperiod;
    const hf = [1.0, 0.82, 1.16, 0.9];
    for (let x = -toff; x < W + tperiod; x += tperiod) {
      const slot = Math.round((x + this.scrollFar) / tperiod);
      this._floodlight(ctx, x + W * 0.18, gy, s, gy * 0.42 * hf[((slot % 4) + 4) % 4]);
    }
    // 물결 (중경)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2 * s;
    for (let row = 0; row < 4; row++) {
      const yy = gy - 14 * s - row * 22 * s;
      const off = (this.scrollMid * (1 + row * 0.2)) % (80 * s);
      ctx.beginPath();
      for (let x = -off; x < W; x += 80 * s) {
        ctx.moveTo(x, yy);
        ctx.quadraticCurveTo(x + 20 * s, yy - 6 * s, x + 40 * s, yy);
        ctx.quadraticCurveTo(x + 60 * s, yy + 6 * s, x + 80 * s, yy);
      }
      ctx.stroke();
    }
    // 결승선/턴마크 깃발 부표 (중경) — 빨강·오렌지 번갈아
    const bperiod = W * 0.62 + 120 * s;
    const boff = this.scrollMid % bperiod;
    let n = 0;
    for (let x = -boff; x < W + bperiod; x += bperiod) {
      this._flagBuoy(ctx, x + W * 0.3, gy, s, (n++ % 2) ? '#E03B3B' : CONFIG.COLORS.ORANGE);
    }
  }

  // 경정장 조명탑 (플러드라이트)
  _floodlight(ctx, x, gy, s, h) {
    const topY = gy - h;
    // 격자 마스트(좁은 사다리꼴)
    const bw = 7 * s, tw = 2.5 * s;
    ctx.fillStyle = 'rgba(90,100,110,0.85)';
    ctx.beginPath();
    ctx.moveTo(x - bw, gy); ctx.lineTo(x - tw, topY); ctx.lineTo(x + tw, topY); ctx.lineTo(x + bw, gy);
    ctx.closePath(); ctx.fill();
    // 가로 격자
    ctx.strokeStyle = 'rgba(90,100,110,0.45)'; ctx.lineWidth = Math.max(0.8, 1 * s);
    for (let yy = topY + 10 * s; yy < gy - 4 * s; yy += 16 * s) {
      const t = (yy - topY) / h, hw = tw + (bw - tw) * t;
      ctx.beginPath(); ctx.moveTo(x - hw, yy); ctx.lineTo(x + hw, yy); ctx.stroke();
    }
    // 조명 패널 (상단, 약간 넓게)
    const pw = 36 * s, ph = 15 * s, py = topY - ph;
    ctx.fillStyle = 'rgba(70,80,90,0.92)';
    ctx.fillRect(x - pw / 2, py, pw, ph);
    // 빛 번짐(글로우)
    ctx.fillStyle = 'rgba(255,250,205,0.22)';
    ctx.beginPath(); ctx.ellipse(x, py + ph * 0.5, pw * 0.85, ph * 1.6, 0, 0, Math.PI * 2); ctx.fill();
    // 램프 점들
    ctx.fillStyle = 'rgba(255,250,210,0.95)';
    const cols = 4, rows = 2, gx = pw / (cols + 1), gyy = ph / (rows + 1);
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        ctx.beginPath();
        ctx.arc(x - pw / 2 + c * gx, py + r * gyy, Math.max(1, 1.8 * s), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 결승선/턴마크 깃발 부표
  _flagBuoy(ctx, x, gy, s, color) {
    const by = gy - 6 * s;          // 수면 위
    // 깃대
    ctx.strokeStyle = '#3A3A3A'; ctx.lineWidth = Math.max(1.5, 2 * s);
    ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, by - 30 * s); ctx.stroke();
    // 깃발
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, by - 30 * s); ctx.lineTo(x + 20 * s, by - 25 * s); ctx.lineTo(x, by - 20 * s);
    ctx.closePath(); ctx.fill();
    // 부표(물에 뜬 공) + 흰 띠
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, by, 9 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 9 * s, by - 2 * s, 18 * s, 4 * s);
    // 잔물결
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = Math.max(1, 1.3 * s);
    ctx.beginPath(); ctx.ellipse(x, by + 7 * s, 16 * s, 4 * s, 0, 0, Math.PI * 2); ctx.stroke();
  }
}
