/**
 * obstacles.js — 장애물(극복 대상)
 * 지면 위 표지판/콘/부표 형태. 키워드 라벨(안일/무기력/비효율/은폐)을 작게 표기.
 */
class Obstacle {
  constructor(game) {
    this.game = game;
    const r = Math.random();
    this.w = 38 + Math.random() * 26;
    this.h = 46 + Math.random() * 40;
    this.x = game.width + 20;
    this.y = game.groundY - this.h;
    this.keyword = CONFIG.OBSTACLE_KEYWORDS[
      Math.floor(Math.random() * CONFIG.OBSTACLE_KEYWORDS.length)
    ];
    this.dead = false;
  }

  update(dt, speed) {
    this.x -= speed * dt;
    if (this.x + this.w < -40) this.dead = true;
  }

  getHitbox() {
    const padX = this.w * 0.14;
    return { x: this.x + padX, y: this.y, w: this.w - padX * 2, h: this.h };
  }

  draw(ctx) {
    const stageId = this.game.stage.id;
    ctx.save();
    // 무대별 형태: 1=표지판/허들, 2=콘/배리어, 3=부표
    if (stageId === 3) {
      this._drawBuoy(ctx);
    } else if (stageId === 2) {
      this._drawCone(ctx);
    } else {
      this._drawSign(ctx);
    }
    this._drawLabel(ctx);
    ctx.restore();
  }

  _drawSign(ctx) {
    const { x, y, w, h } = this;
    ctx.fillStyle = CONFIG.COLORS.INK;
    ctx.fillRect(x + w / 2 - 3, y + h * 0.35, 6, h * 0.65); // 기둥
    ctx.fillStyle = '#D64545';
    ctx.fillRect(x, y, w, h * 0.45); // 판
    ctx.fillStyle = CONFIG.COLORS.WHITE;
    ctx.fillRect(x + 4, y + 4, w - 8, h * 0.45 - 8);
  }

  _drawCone(ctx) {
    const { x, y, w, h } = this;
    ctx.fillStyle = CONFIG.COLORS.ORANGE;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = CONFIG.COLORS.WHITE;
    ctx.fillRect(x + w * 0.18, y + h * 0.45, w * 0.64, h * 0.16);
  }

  _drawBuoy(ctx) {
    const { x, y, w, h } = this;
    ctx.fillStyle = '#E03B3B';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.6, w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CONFIG.COLORS.WHITE;
    ctx.fillRect(x + w * 0.1, y + h * 0.5, w * 0.8, h * 0.12);
    // 상단 깃대
    ctx.fillStyle = CONFIG.COLORS.INK;
    ctx.fillRect(x + w / 2 - 2, y, 4, h * 0.35);
  }

  _drawLabel(ctx) {
    const { x, y, w } = this;
    ctx.font = 'bold 13px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    const tx = x + w / 2;
    const ty = y - 8;
    const tw = ctx.measureText(this.keyword).width + 10;
    ctx.fillStyle = 'rgba(26,26,26,0.78)';
    ctx.beginPath();
    const rx = tx - tw / 2, ry = ty - 14, rh = 18;
    ctx.roundRect ? ctx.roundRect(rx, ry, tw, rh, 5) : ctx.rect(rx, ry, tw, rh);
    ctx.fill();
    ctx.fillStyle = CONFIG.COLORS.WHITE;
    ctx.fillText(this.keyword, tx, ty - 1);
  }
}

/**
 * 경영방침 코인 (존중·조화·정정당당). 점프로 획득 시 보너스 점수 + 이펙트.
 * 코인 베이스는 얼굴 아이콘.
 */
class Coin {
  constructor(game, x) {
    this.game = game;
    this.r = 20;
    this.x = x;
    // 공중에 떠 있어 점프로 획득
    this.y = game.groundY - this.r - (70 + Math.random() * 90);
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
    const bob = Math.sin(this.t) * 4;
    const cy = this.y + bob;
    ctx.save();
    // CI 오렌지 링
    ctx.beginPath();
    ctx.arc(this.x, cy, this.r + 4, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLORS.ORANGE;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x, cy, this.r, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.COLORS.WHITE;
    ctx.fill();
    if (face && face.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, cy, this.r - 2, 0, Math.PI * 2);
      ctx.clip();
      const ratio = face.naturalWidth / face.naturalHeight;
      const fh = this.r * 2.2, fw = fh * ratio;
      ctx.drawImage(face, this.x - fw / 2, cy - fh / 2, fw, fh);
      ctx.restore();
    }
    // 키워드 라벨
    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.COLORS.BLUE;
    ctx.fillText(this.keyword, this.x, cy + this.r + 16);
    ctx.restore();
  }
}
