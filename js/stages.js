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
    // 스피돔 돔형 경기장 (원경) — 띄엄띄엄 반복
    const period = W * 1.2 + 320 * s;
    const off = this.scrollFar % period;
    for (let x = -off; x < W + period; x += period) {
      this._velodrome(ctx, x + W * 0.5, gy, s);
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

  // 스피돔(광명 스피돔) 실루엣 — 낮고 넓은 타원 + 나선형 은빛 돔 지붕 + 유리 외벽
  _velodrome(ctx, cx, gy, s) {
    const W = this.game.width;
    const bw = W * 0.66;          // 전체 폭(넓게)
    const bodyH = gy * 0.2;       // 유리 외벽(낮게)
    const drumTopY = gy - bodyH;
    const roofH = gy * 0.24;      // 돔 높이

    // 유리 외벽(드럼) — 위는 타원으로 둥글게
    ctx.fillStyle = '#8FA39A';
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2, gy);
    ctx.lineTo(cx - bw / 2, drumTopY);
    ctx.ellipse(cx, drumTopY, bw / 2, bodyH * 0.5, 0, Math.PI, 0);
    ctx.lineTo(cx + bw / 2, gy);
    ctx.ellipse(cx, gy, bw / 2, bodyH * 0.42, 0, 0, Math.PI);
    ctx.closePath(); ctx.fill();
    // 유리 층 라인(가로) + 반사
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = Math.max(1, 1.6 * s);
    for (let i = 1; i <= 3; i++) {
      const yy = drumTopY + (bodyH * i / 4);
      ctx.beginPath(); ctx.ellipse(cx, yy, bw / 2 * 0.99, bodyH * 0.5 * (1 - i * 0.03), 0, 0, Math.PI); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(210,225,220,0.35)';
    ctx.beginPath();
    ctx.moveTo(cx - bw * 0.34, drumTopY + bodyH * 0.1);
    ctx.lineTo(cx - bw * 0.18, drumTopY + bodyH * 0.1);
    ctx.lineTo(cx - bw * 0.30, gy);
    ctx.lineTo(cx - bw * 0.46, gy);
    ctx.closePath(); ctx.fill();

    // 나선형 은빛 돔 지붕 — 점점 작아지는 동심 타원 띠(은/밝은은 교대)
    const shades = ['#B7C2C7', '#D6DEE2'];
    let rx = bw * 0.54, ry = roofH, rcx = cx, rcy = drumTopY;
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = shades[i % 2];
      ctx.beginPath();
      ctx.ellipse(rcx, rcy, rx, ry, 0, Math.PI, 2 * Math.PI);
      ctx.closePath(); ctx.fill();
      rx *= 0.82; ry *= 0.84;
      rcy -= ry * 0.2; rcx += rx * 0.04;   // 위로 + 살짝 오른쪽 → 나선 비대칭
    }
    // 지붕-외벽 경계 그림자
    ctx.strokeStyle = 'rgba(80,95,100,0.4)'; ctx.lineWidth = Math.max(1, 1.5 * s);
    ctx.beginPath(); ctx.ellipse(cx, drumTopY, bw * 0.54, roofH, 0, Math.PI, 2 * Math.PI); ctx.stroke();
  }

  _drawWater(ctx, stage) {
    const gy = this.game.groundY, W = this.game.width;
    // 물결 (중경)
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    for (let row = 0; row < 4; row++) {
      const yy = gy - 14 - row * 22;
      const off = (this.scrollMid * (1 + row * 0.2)) % 80;
      ctx.beginPath();
      for (let x = -off; x < W; x += 80) {
        ctx.moveTo(x, yy);
        ctx.quadraticCurveTo(x + 20, yy - 6, x + 40, yy);
        ctx.quadraticCurveTo(x + 60, yy + 6, x + 80, yy);
      }
      ctx.stroke();
    }
    // 턴마크 부표 (원경)
    const off2 = this.scrollFar % (W + 300);
    ctx.fillStyle = 'rgba(255,127,0,0.6)';
    ctx.beginPath();
    ctx.arc(W - off2, gy - 30, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}
