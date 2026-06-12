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
    const gy = this.game.groundY;
    // 세계평화의문 실루엣 (원경)
    const W = this.game.width;
    const off = this.scrollFar % (W + 200);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const px = W - off;
    ctx.beginPath();
    ctx.moveTo(px, gy);
    ctx.lineTo(px + 30, gy - 130);
    ctx.lineTo(px + 110, gy - 150);
    ctx.lineTo(px + 140, gy);
    ctx.closePath();
    ctx.fill();
    // 잔디 언덕 (중경)
    this._hills(ctx, gy - 10, 24, 'rgba(94,145,80,0.5)', this.scrollMid, 320);
  }

  _drawVelodrome(ctx, stage) {
    const gy = this.game.groundY, W = this.game.width;
    // 관중석 실루엣 (원경)
    this._hills(ctx, gy - 20, 40, 'rgba(120,90,60,0.35)', this.scrollFar, 260);
    // 기울어진 뱅크 라인 (중경)
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 3;
    const off = this.scrollMid % 120;
    for (let x = -off; x < W; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + 60, gy - 40);
      ctx.stroke();
    }
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
