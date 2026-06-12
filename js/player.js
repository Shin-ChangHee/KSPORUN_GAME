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
    this.dustTimer = 0;     // 트레일 입자 스폰 타이머
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

    // 무대별 이동 트레일(달리기 먼지 / 자전거 먼지 / 보트 물보라)
    this.dustTimer -= dt;
    if (this.dustTimer <= 0) {
      this.dustTimer = 0.08;
      this._spawnTrail();
    }
  }

  // 발/바퀴/선미 뒤로 짧은 입자를 흘려 속도감·디테일 강화
  _spawnTrail() {
    const g = this.game;
    if (!g.particles) return;
    const stageId = g.stage.id;
    const footX = this.x + this.w * 0.32;
    const groundY = this.groundY;
    if (stageId === 3) {
      // 보트 물보라(선미=뒤쪽에서 흩뿌림)
      for (let i = 0; i < 2; i++) {
        g.particles.push({
          x: this.x - this.w * 0.2, y: groundY - 6 - Math.random() * 8,
          vx: -120 - Math.random() * 120, vy: -40 - Math.random() * 90,
          life: 0.45, color: i ? '#FFFFFF' : '#1B99C4',
        });
      }
    } else if (this.onGround) {
      // 달리기/자전거 먼지
      g.particles.push({
        x: footX, y: groundY - 4,
        vx: -90 - Math.random() * 80, vy: -20 - Math.random() * 40,
        life: 0.35, color: 'rgba(120,110,90,0.5)',
      });
    }
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

    if (stageId === 3) { this._drawBoat(ctx); return; }

    const isBike = stageId === 2;
    const img = this.game.assets[isBike ? 'player_bike' : 'player_run'];

    let bounce = 0, squashX = 1, squashY = 1;
    if (this.onGround) {
      const t = this.runTime * 12;
      if (isBike) {
        bounce = Math.sin(t) * -3;                  // 자전거: 가벼운 상하 흔들림(스쿼시 없음)
      } else {
        bounce = Math.abs(Math.sin(t)) * -8;        // 달리기: 바운스 + 스쿼시
        const s = Math.sin(t * 2) * 0.04;
        squashX = 1 + s; squashY = 1 - s;
        if (this.landSquash > 0) {
          squashX += this.landSquash * 0.18;
          squashY -= this.landSquash * 0.18;
        }
      }
    }

    if (isBike) this._drawSpeedLines(ctx);

    const cx = this.x + this.w / 2;
    const cy = this.y + this.h + bounce;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(squashX, squashY);
    if (img && img.complete) {
      const ratio = img.naturalWidth / img.naturalHeight;
      let h = this.h * (isBike ? 1.32 : 1.0);       // 자전거 풀 라이딩 포즈는 키워서 표시
      let w = h * ratio;
      const maxW = this.w * (isBike ? 1.8 : 1.3);
      if (w > maxW) { w = maxW; h = w / ratio; }
      ctx.drawImage(img, -w / 2, -h, w, h);
    } else {
      ctx.fillStyle = CONFIG.COLORS.SKYBLUE;
      ctx.fillRect(-this.w / 2, -this.h, this.w, this.h);
    }
    ctx.restore();
  }

  // 자전거 속도선
  _drawSpeedLines(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(27,153,196,0.35)';
    ctx.lineWidth = 3;
    const baseY = this.y + this.h * 0.4;
    for (let i = 0; i < 3; i++) {
      const y = baseY + i * 18;
      const len = 26 + (i % 2) * 14;
      const off = (this.runTime * 700 + i * 40) % 60;
      ctx.beginPath();
      ctx.moveTo(this.x - 10 - off, y);
      ctx.lineTo(this.x - 10 - off - len, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3단계: 캔버스로 모터보트를 디테일하게 그리고 백호돌이 얼굴을 라이더로 합성
  // (뱃머리=오른쪽=진행 방향, 선미/모터=왼쪽)
  _drawBoat(ctx) {
    const face = this.game.assets['icon_face'];
    const cx = this.x + this.w / 2;
    const bob = this.onGround ? Math.sin(this.runTime * 6) * 2 : 0;
    const by = this.y + this.h + bob;     // 수면 라인
    const hw = this.w * 0.92;             // 선체 반폭
    const hullH = this.h * 0.42;
    const C = CONFIG.COLORS;

    ctx.save();
    ctx.lineJoin = 'round';

    // 모터(선미=왼쪽)
    ctx.fillStyle = C.INK;
    ctx.fillRect(cx - hw - 7, by - hullH * 0.95, 11, hullH * 0.8);
    ctx.fillRect(cx - hw - 9, by - hullH * 0.2, 15, hullH * 0.28);

    // 선체(오렌지) — 오른쪽으로 뾰족한 뱃머리
    ctx.fillStyle = C.ORANGE;
    ctx.strokeStyle = C.INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + hw, by - hullH * 0.55);                       // 뱃머리 끝
    ctx.lineTo(cx + hw * 0.15, by - hullH);                       // 갑판 앞
    ctx.lineTo(cx - hw, by - hullH);                              // 갑판 뒤(선미)
    ctx.lineTo(cx - hw, by - hullH * 0.3);                        // 선미 하단
    ctx.quadraticCurveTo(cx - hw * 0.2, by + 4, cx + hw * 0.55, by - 2); // 선저 곡선
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 흰 데크 띠
    ctx.fillStyle = C.WHITE;
    ctx.fillRect(cx - hw * 0.98, by - hullH + 3, hw * 1.05, hullH * 0.2);
    // 워터라인(짙은 파랑)
    ctx.fillStyle = C.BLUE;
    ctx.fillRect(cx - hw, by - 5, hw * 1.9, 5);

    // 윈드실드(스카이블루 반투명)
    ctx.fillStyle = 'rgba(27,153,196,0.55)';
    ctx.strokeStyle = C.INK; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 2, by - hullH);
    ctx.lineTo(cx + hw * 0.42, by - hullH);
    ctx.lineTo(cx + hw * 0.26, by - hullH - this.h * 0.22);
    ctx.lineTo(cx + 2, by - hullH - this.h * 0.22);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // 선체 번호
    ctx.fillStyle = C.BLUE;
    ctx.font = 'bold 18px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('7', cx - hw * 0.45, by - hullH * 0.35);

    // 라이더(백호돌이 얼굴)
    if (face && face.complete) {
      const fh = this.h * 0.74;
      const fw = fh * (face.naturalWidth / face.naturalHeight);
      ctx.drawImage(face, cx - fw / 2 - this.w * 0.05, by - hullH - fh * 0.84, fw, fh);
    }
    ctx.restore();
  }
}
