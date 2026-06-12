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
    const s = g.scale || 1;
    this.w = 96 * s;
    this.h = 110 * s;
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
    this.runPhase = 0;      // 달리기 다리 사이클 위상
  }

  // 화면 크기 변경(리사이즈/회전) 시 위치·크기 재계산 (진행 상태 보존)
  relayout() {
    const g = this.game;
    const s = g.scale || 1;
    const wasOnGround = this.onGround;
    this.w = 96 * s;
    this.h = 110 * s;
    this.x = g.width * 0.16;
    this.groundY = g.groundY;
    const floor = this.groundY - this.h;
    if (wasOnGround) this.y = floor;
    else this.y = Math.min(this.y, floor);
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
    this.vy = CONFIG.JUMP_VELOCITY * (this.game.scale || 1);
    this.onGround = false;
    this.coyoteTimer = 0;
    this.bufferTimer = 0;
    this.game.audio.play('jump');
  }

  update(dt) {
    this.runTime += dt;
    // 달리기 다리 사이클: 게임 속도에 비례(보폭 = 캐릭터 크기 기준)
    if (this.onGround) this.runPhase += dt * (this.game.speed / (this.h * 0.30));

    // 코요테 타임: 지면이면 충전, 공중이면 감소
    if (this.onGround) this.coyoteTimer = CONFIG.COYOTE_TIME;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);

    // 버퍼된 점프 입력 처리(착지 직전/직후 입력도 반영)
    if (this.bufferTimer > 0) {
      this.bufferTimer -= dt;
      if (this.coyoteTimer > 0) this._doJump();
    }

    // 중력 적용 (월드 스케일 반영 → 점프 체공시간은 일정, 점프 높이는 화면 비례)
    const s = this.game.scale || 1;
    this.vy += CONFIG.GRAVITY * s * dt;
    if (this.vy > CONFIG.MAX_FALL_SPEED * s) this.vy = CONFIG.MAX_FALL_SPEED * s;
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
    const s = g.scale || 1;
    const stageId = g.stage.id;
    const footX = this.x + this.w * 0.32;
    const groundY = this.groundY;
    if (stageId === 3) {
      // 보트 물보라(선미=뒤쪽에서 흩뿌림)
      for (let i = 0; i < 2; i++) {
        g.particles.push({
          x: this.x - this.w * 0.2, y: groundY - (6 + Math.random() * 8) * s,
          vx: (-120 - Math.random() * 120) * s, vy: (-40 - Math.random() * 90) * s,
          life: 0.45, color: i ? '#FFFFFF' : '#1B99C4',
        });
      }
    } else if (this.onGround) {
      // 달리기/자전거 먼지
      g.particles.push({
        x: footX, y: groundY - 4 * s,
        vx: (-90 - Math.random() * 80) * s, vy: (-20 - Math.random() * 40) * s,
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

    // 1단계 스프라이트가 아직 안 떴으면 캔버스 러너로 폴백
    if (!isBike && (!img || !img.complete)) { this._drawRunner(ctx); return; }

    let bounce = 0, squashX = 1, squashY = 1;
    if (this.onGround) {
      const t = this.runTime * 12;
      const sc = this.game.scale || 1;
      if (isBike) {
        bounce = Math.sin(t) * -3;                  // 자전거: 가벼운 상하 흔들림
      } else {
        bounce = Math.abs(Math.sin(t)) * -2.5 * sc; // 달리기: 바운스 최소화(통통 튐 완화)
        const s = Math.sin(t * 2) * 0.012;          // 스쿼시도 약하게
        squashX = 1 + s; squashY = 1 - s;
        if (this.landSquash > 0) {
          squashX += this.landSquash * 0.10;
          squashY -= this.landSquash * 0.10;
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
      let h = this.h * (isBike ? 1.32 : 1.16), w = h * ratio;
      const maxW = this.w * (isBike ? 1.8 : 1.7);
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

  // 1단계: 캔버스로 직접 그리는 "달리는 백호돌이" (실제 다리 애니메이션)
  _drawRunner(ctx) {
    const C = CONFIG.COLORS;
    const Hc = this.h;
    const o = Math.max(1.5, Hc * 0.020);
    const cx = this.x + this.w / 2;
    const footBase = this.y + this.h;                 // 점프 시 함께 상승
    const phase = this.onGround ? this.runPhase : Math.PI * 0.5; // 공중=도약 포즈
    const bob = this.onGround ? Math.abs(Math.sin(phase)) * Hc * 0.035 : 0;
    const ty = footBase - Hc * 0.56 - bob;            // 몸통 중심 y
    const torsoRx = Hc * 0.27, torsoRy = Hc * 0.255;
    const hy = ty + Hc * 0.16;
    const hipB = [cx - Hc * 0.04, hy], hipF = [cx + Hc * 0.07, hy];
    const thigh = Hc * 0.20, shin = Hc * 0.21;
    const legW = Hc * 0.085, armW = Hc * 0.068;
    const WHITE = '#FFFFFF', BLACK = '#1A1A1A', GREY = '#B0B6BC', RED = '#E45656';

    const limb = (pts, w) => {
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = BLACK; ctx.lineWidth = w + 2 * o;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      ctx.strokeStyle = WHITE; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    };
    const legPts = (hip, ph) => {
      const A = 0.85 * Math.sin(ph);
      const bend = 0.30 + 0.55 * Math.max(0, -Math.sin(ph));
      const K = [hip[0] + thigh * Math.sin(A), hip[1] + thigh * Math.cos(A)];
      const sA = A - bend;
      const F = [K[0] + shin * Math.sin(sA), K[1] + shin * Math.cos(sA)];
      return [hip, K, F];
    };
    const ell = (x, y, rx, ry, fill, stroke) => {
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = BLACK; ctx.lineWidth = o; ctx.stroke(); }
    };
    const shoe = (F) => ell(F[0] + Hc * 0.03, F[1] + Hc * 0.005, Hc * 0.08, Hc * 0.042, GREY, true);
    const stripeArc = (x, y, rx, ry) => {
      ctx.strokeStyle = BLACK; ctx.lineWidth = o; ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, Math.PI * 1.66, Math.PI * 0.22); ctx.stroke();
    };

    ctx.save();
    // 앞으로 기울이기(달리는 자세)
    ctx.translate(cx, hy); ctx.rotate(-7 * Math.PI / 180); ctx.translate(-cx, -hy);

    // 꼬리 (뒤, 줄무늬 끝)
    const tb = [cx - torsoRx * 0.70, ty + Hc * 0.12];
    const tail = [tb, [cx - torsoRx - Hc * 0.13, ty + Hc * 0.08], [cx - torsoRx - Hc * 0.13, ty - Hc * 0.05]];
    limb(tail, Hc * 0.055);
    const tip = tail[2];
    ctx.strokeStyle = BLACK; ctx.lineWidth = Hc * 0.022; ctx.lineCap = 'butt';
    for (let i = 0; i < 3; i++) {
      const yy = tip[1] + i * Hc * 0.05 - Hc * 0.02;
      ctx.beginPath(); ctx.moveTo(tip[0] - Hc * 0.045, yy); ctx.lineTo(tip[0] + Hc * 0.045, yy); ctx.stroke();
    }

    // 뒤 팔 / 뒤 다리
    const shB = [cx - Hc * 0.02, ty - Hc * 0.04], aA = 0.6 * Math.sin(phase + Math.PI);
    const elB = [shB[0] + Hc * 0.10 * Math.sin(aA), shB[1] + Hc * 0.11 * Math.cos(aA)];
    const haB = [elB[0] + Hc * 0.10 * Math.sin(aA - 0.5), elB[1] + Hc * 0.10 * Math.cos(aA - 0.5)];
    limb([shB, elB, haB], armW);
    const legBk = legPts(hipB, phase + Math.PI); limb(legBk, legW); shoe(legBk[2]);

    // 몸통
    ell(cx, ty, torsoRx, torsoRy, WHITE, true);
    stripeArc(cx - torsoRx * 0.55, ty - Hc * 0.05, torsoRx * 0.35, Hc * 0.05);
    stripeArc(cx - torsoRx * 0.55, ty + Hc * 0.06, torsoRx * 0.35, Hc * 0.05);

    // 머리
    const hx = cx + Hc * 0.07, hYc = ty - Hc * 0.33, hr = Hc * 0.225;
    ell(hx - hr * 0.66, hYc - hr * 0.83, hr * 0.33, hr * 0.4, WHITE, true);
    ell(hx + hr * 0.66, hYc - hr * 0.83, hr * 0.33, hr * 0.4, WHITE, true);
    ell(hx, hYc, hr, hr, WHITE, true);
    // 이마 ‡ 마크
    const mx = hx - hr * 0.05, my = hYc - hr * 0.45;
    ctx.strokeStyle = BLACK; ctx.lineCap = 'round'; ctx.lineWidth = o * 1.3;
    const seg = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    seg(mx, my - hr * 0.26, mx, my + hr * 0.20);
    seg(mx - hr * 0.22, my - hr * 0.10, mx + hr * 0.22, my - hr * 0.10);
    seg(mx - hr * 0.27, my + hr * 0.10, mx + hr * 0.27, my + hr * 0.10);
    // 눈
    ell(hx + hr * 0.16, hYc + hr * 0.10, o * 0.85, o * 0.85, BLACK, false);
    ell(hx + hr * 0.60, hYc + hr * 0.10, o * 0.85, o * 0.85, BLACK, false);
    // 주둥이 + 코 + 혀
    ell(hx + hr * 0.42, hYc + hr * 0.48, hr * 0.40, hr * 0.30, WHITE, true);
    ell(hx + hr * 0.42, hYc + hr * 0.34, o * 0.9, o * 0.7, BLACK, false);
    ell(hx + hr * 0.42, hYc + hr * 0.62, hr * 0.11, hr * 0.10, RED, false);
    // 볼 줄무늬
    stripeArc(hx - hr * 0.5, hYc + hr * 0.1, hr * 0.32, hr * 0.34);

    // 앞 다리 / 앞 팔
    const legFr = legPts(hipF, phase); limb(legFr, legW); shoe(legFr[2]);
    const shF = [cx + Hc * 0.09, ty - Hc * 0.03], aA2 = 0.95 * Math.sin(phase);
    const elF = [shF[0] + Hc * 0.14 * Math.sin(aA2), shF[1] + Hc * 0.14 * Math.cos(aA2)];
    const haF = [elF[0] + Hc * 0.10 * Math.sin(aA2 + 0.6), elF[1] + Hc * 0.10 * Math.cos(aA2 + 0.6)];
    limb([shF, elF, haF], armW);

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
