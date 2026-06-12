/**
 * player.js — 백호돌이
 * 무대별 동작(달리기/자전거/보트), 점프 물리, 달리기 바운스/스쿼시 연출.
 */
class Player {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    const g = this.game;
    this.w = 96;
    this.h = 110;
    this.x = g.width * 0.16;
    this.groundY = g.groundY;       // 발이 닿는 y
    this.y = this.groundY - this.h; // top-left y
    this.vy = 0;
    this.onGround = true;
    this.runTime = 0;
    this.jumpHeld = false;
    this.coyoteTimer = 0;   // 지면을 벗어난 뒤 남은 점프 허용 시간
    this.bufferTimer = 0;   // 기억해 둔 점프 입력 잔여 시간
    this.landSquash = 0;    // 착지 스쿼시 연출
  }

  // 점프 버튼을 누른 순간 (가변 점프 시작 + 버퍼 기록)
  onPressJump() {
    this.jumpHeld = true;
    this.bufferTimer = CONFIG.JUMP_BUFFER;
  }

  // 점프 버튼을 뗀 순간 (상승 중이면 속도를 잘라 낮은 점프)
  onReleaseJump() {
    this.jumpHeld = false;
    if (this.vy < 0) this.vy *= CONFIG.JUMP_CUT;
  }

  _doJump() {
    this.vy = CONFIG.JUMP_VELOCITY;
    this.onGround = false;
    this.coyoteTimer = 0;
    this.bufferTimer = 0;
    this.game.audio.play('jump');
  }

  update(dt) {
    this.runTime += dt;

    // 코요테 타임: 지면이면 충전, 공중이면 감소
    if (this.onGround) this.coyoteTimer = CONFIG.COYOTE_TIME;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);

    // 버퍼된 점프 입력 처리(착지 직전/직후 입력도 반영)
    if (this.bufferTimer > 0) {
      this.bufferTimer -= dt;
      if (this.coyoteTimer > 0) this._doJump();
    }

    // 중력 적용
    this.vy += CONFIG.GRAVITY * dt;
    if (this.vy > CONFIG.MAX_FALL_SPEED) this.vy = CONFIG.MAX_FALL_SPEED;
    this.y += this.vy * dt;

    // 지면 착지
    const floor = this.groundY - this.h;
    if (this.y >= floor) {
      if (!this.onGround) this.landSquash = 1; // 착지 순간 스쿼시
      this.y = floor;
      this.vy = 0;
      this.onGround = true;
    }
    if (this.landSquash > 0) this.landSquash = Math.max(0, this.landSquash - dt * 6);
  }

  // 충돌 판정용 내부 히트박스 (스프라이트보다 작게 → 억울한 죽음 방지)
  getHitbox() {
    const padX = this.w * 0.22;
    const padTop = this.h * 0.12;
    const padBottom = this.h * 0.06;
    return {
      x: this.x + padX,
      y: this.y + padTop,
      w: this.w - padX * 2,
      h: this.h - padTop - padBottom,
    };
  }

  draw(ctx) {
    const stageId = this.game.stage.id;
    const img = this.game.assets[stageId === 2 ? 'player_bike' : 'player_run'];

    // 달리기 바운스 + 스쿼시 (지면에 있을 때만)
    let bounce = 0;
    let squashX = 1, squashY = 1;
    if (this.onGround) {
      const t = this.runTime * 12;
      bounce = Math.abs(Math.sin(t)) * -8;          // 위로 살짝 튀어오름
      const s = Math.sin(t * 2) * 0.04;
      squashX = 1 + s;
      squashY = 1 - s;
    }
    // 착지 스쿼시(납작) 연출
    if (this.landSquash > 0) {
      squashX += this.landSquash * 0.18;
      squashY -= this.landSquash * 0.18;
    }

    const drawW = this.w;
    const drawH = this.h;

    if (stageId === 3) {
      this._drawBoat(ctx);
      return;
    }

    ctx.save();
    const cx = this.x + drawW / 2;
    const cy = this.y + drawH + bounce;
    ctx.translate(cx, cy);
    ctx.scale(squashX, squashY);
    if (img && img.complete) {
      const ratio = img.naturalWidth / img.naturalHeight;
      let w = drawH * ratio, h = drawH;
      if (w > drawW * 1.3) { w = drawW * 1.3; h = w / ratio; }
      ctx.drawImage(img, -w / 2, -h, w, h);
    } else {
      // 폴백: 단순 박스
      ctx.fillStyle = CONFIG.COLORS.SKYBLUE;
      ctx.fillRect(-drawW / 2, -drawH, drawW, drawH);
    }
    ctx.restore();
  }

  // 3단계: 캔버스로 보트를 그리고 그 위에 백호돌이 얼굴 아이콘을 합성
  _drawBoat(ctx) {
    const face = this.game.assets['icon_face'];
    const baseY = this.y + this.h;
    const cx = this.x + this.w / 2;
    const boatW = this.w * 1.5;
    const boatH = this.h * 0.42;

    ctx.save();
    // 보트 선체
    ctx.fillStyle = CONFIG.COLORS.ORANGE;
    ctx.beginPath();
    ctx.moveTo(cx - boatW / 2, baseY - boatH);
    ctx.lineTo(cx + boatW / 2, baseY - boatH);
    ctx.lineTo(cx + boatW / 2 - boatH * 0.7, baseY);
    ctx.lineTo(cx - boatW / 2 + boatH * 0.4, baseY);
    ctx.closePath();
    ctx.fill();
    // 흰색 측면 라인
    ctx.fillStyle = CONFIG.COLORS.WHITE;
    ctx.fillRect(cx - boatW / 2, baseY - boatH, boatW, boatH * 0.22);
    // 얼굴 합성
    if (face && face.complete) {
      const ratio = face.naturalWidth / face.naturalHeight;
      const fh = this.h * 0.7;
      const fw = fh * ratio;
      ctx.drawImage(face, cx - fw / 2, baseY - boatH - fh * 0.78, fw, fh);
    }
    ctx.restore();
  }
}
