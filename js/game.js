/**
 * game.js — 게임 루프 & 상태머신
 * 상태: TITLE → STAGE_CARD → PLAY → (GAMEOVER | 다음 STAGE_CARD) → CLEAR
 */
const STATE = {
  LOADING: 'LOADING',
  TITLE: 'TITLE',
  STAGE_CARD: 'STAGE_CARD',
  PLAY: 'PLAY',
  GAMEOVER: 'GAMEOVER',
  CLEAR: 'CLEAR',
};

const ASSET_FILES = {
  player_run: 'assets/images/player_run.png',
  player_bike: 'assets/images/player_bike.png',
  player_boat: 'assets/images/player_boat.png',
  icon_face: 'assets/images/icon_face.png',
  logo_title: 'assets/images/logo_title.png',
  title_suit: 'assets/images/title_suit.png',
  title_trench: 'assets/images/title_trench.png',
  mascot_cycle_kspo: 'assets/images/mascot_cycle_kspo.png',
  clear_sparkle: 'assets/images/clear_sparkle.png',
  clear_cool: 'assets/images/clear_cool.png',
  gameover_peace: 'assets/images/gameover_peace.png',
  value_meditation: 'assets/images/value_meditation.png',
};

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = CONFIG.BASE_WIDTH;
    this.height = CONFIG.BASE_HEIGHT;
    this.groundY = this.height * CONFIG.GROUND_RATIO;
    this.scale = 1;            // 화면 크기에 맞춘 월드 스케일 (가로 기준)
    this.dpr = window.devicePixelRatio || 1;

    this.assets = {};
    this.audio = new AudioManager();
    this.state = STATE.LOADING;
    this.best = parseInt(localStorage.getItem(CONFIG.STORAGE_BEST) || '0', 10);

    this.stageRenderer = new StageRenderer(this);
    this.player = new Player(this);

    this.score = 0;
    this.stageIndex = 0;
    this.stage = CONFIG.STAGES[0];
    this.speed = this.stage.speed;
    this.obstacles = [];
    this.coins = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.nextSpawn = 1.2;
    this.coinTimer = 0;
    this.nextCoin = 1.5;
    this.cardTimer = 0;
    this.elapsed = 0;
    this.coinsCollected = 0;
    this.shakeTimer = 0;
    this.isNewBest = false;
    this.endless = false;   // 3단계 완주 후 무한 주행 모드

    this._lastTime = 0;
    this._bound = this._loop.bind(this);

    this._setupCanvas();
    this._bindInput();
    this._loadAssets();
  }

  _setupCanvas() {
    const apply = () => {
      const wrap = this.canvas.parentElement;
      // 화면(컨테이너)을 그대로 채우는 반응형 캔버스 — 가로/세로 모두 대응
      const cw = Math.max(240, wrap.clientWidth);
      const ch = Math.max(240, wrap.clientHeight);
      this.width = cw;
      this.height = ch;
      // 월드 스케일은 '가로 너비' 기준 → 장애물 반응 시간이 화면비와 무관하게 일정
      this.scale = this.width / CONFIG.BASE_WIDTH;
      this.groundY = this.height * CONFIG.GROUND_RATIO;
      this.canvas.style.width = cw + 'px';
      this.canvas.style.height = ch + 'px';
      this.canvas.width = Math.round(cw * this.dpr);
      this.canvas.height = Math.round(ch * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      if (this.player && this.player.relayout) this.player.relayout();
    };
    apply();
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', () => setTimeout(apply, 80));
  }

  _loadAssets() {
    const keys = Object.keys(ASSET_FILES);
    let loaded = 0;
    if (keys.length === 0) { this._onReady(); return; }
    keys.forEach((k) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded === keys.length) this._onReady();
      };
      // 캐시 무력화: 배포 빌드 버전을 쿼리로 부착(있을 때만)
      const ver = (window.BUILD && window.BUILD.indexOf('_') !== 0) ? ('?v=' + window.BUILD) : '';
      img.src = ASSET_FILES[k] + ver;
      this.assets[k] = img;
    });
  }

  _onReady() {
    this.state = STATE.TITLE;
    requestAnimationFrame(this._bound);
  }

  _bindInput() {
    // 누름: 플레이 중이면 점프 시작(가변 점프), 그 외 화면은 시작/재시작
    const press = () => {
      this.audio.unlock();
      if (this.state === STATE.PLAY) this.player.onPressJump();
      else this._press();
    };
    // 뗌: 플레이 중 상승 점프를 잘라 가변 높이 구현
    const release = () => {
      if (this.state === STATE.PLAY) this.player.onReleaseJump();
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (e.repeat) return; // 키 반복 무시
        press();
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') release();
    });
    this.canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
    this.canvas.addEventListener('pointerup', (e) => { e.preventDefault(); release(); });

    // UI 버튼
    document.addEventListener('click', (e) => {
      const id = e.target.id;
      const endlessBtn = e.target.closest ? e.target.closest('[data-endless]') : null;
      if (id === 'btn-mute') {
        this.audio.unlock();
        const muted = this.audio.toggleMute();
        e.target.textContent = muted ? '🔇' : '🔊';
      } else if (id === 'btn-restart' || id === 'btn-replay') {
        this.audio.unlock();
        this._startGame();
      } else if (endlessBtn) {
        this.audio.unlock();
        this._continueEndless(parseInt(endlessBtn.getAttribute('data-endless'), 10));
      } else if (e.target.classList && e.target.classList.contains('js-share')) {
        Share.shareResult(this);
      }
    });
  }

  _press() {
    switch (this.state) {
      case STATE.TITLE: this._startGame(); break;
      case STATE.GAMEOVER:
      case STATE.CLEAR:
        // 화면 버튼으로 재시작 유도 (오발사 방지: 0.6초 후 탭 허용)
        if (this.elapsed - this._endTime > 0.6) this._startGame();
        break;
    }
  }

  _startGame() {
    this.score = 0;
    this.stageIndex = 0;
    this.stage = CONFIG.STAGES[0];
    this.speed = this.stage.speed;
    this.obstacles = [];
    this.coins = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.nextSpawn = 1.0;
    this.coinTimer = 0;
    this.nextCoin = 1.8;
    this.coinsCollected = 0;
    this.endless = false;
    this.player.reset();
    this._showCard(0);
    this.audio.startBgm();
  }

  // 완주 후 무한질주(4단계) — 선택한 모드(0:달리기/1:자전거/2:보트)로 게임오버까지
  // 난이도는 선택과 무관하게 CONFIG.ENDLESS로 동일하게 적용
  _continueEndless(choice) {
    this.endless = true;
    const idx = Math.max(0, Math.min(CONFIG.STAGES.length - 1, choice || 0));
    this.stageIndex = idx;                  // 비주얼(캐릭터/배경/장애물)은 선택한 무대
    this.stage = CONFIG.STAGES[idx];
    this.speed = CONFIG.ENDLESS.speed * this.scale;
    this.obstacles = [];
    this.coins = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.nextSpawn = CONFIG.START_GRACE;            // 재개 직후 충돌 방지
    this.coinTimer = 0;
    this.nextCoin = CONFIG.START_GRACE;
    this.player.reset();
    this.state = STATE.PLAY;
    this.audio.startBgm();
    this._syncOverlay();
  }

  _showCard(index) {
    this.stageIndex = index;
    this.stage = CONFIG.STAGES[index];
    this.speed = this.stage.speed * this.scale;
    this.state = STATE.STAGE_CARD;
    this.cardTimer = 0;
    // 무대 진입 시 첫 장애물까지 유예 부여(시작하자마자 충돌 방지)
    this.spawnTimer = 0;
    this.nextSpawn = CONFIG.START_GRACE;
    this.coinTimer = 0;
    this.nextCoin = CONFIG.START_GRACE + 0.6;
    this.audio.play('stage');
    this._syncOverlay();
  }

  _advanceStage() {
    if (this.stageIndex < CONFIG.STAGES.length - 1) {
      this.obstacles = [];
      this.coins = [];
      this.player.reset();
      this._showCard(this.stageIndex + 1);
    } else {
      this._clear();
    }
  }

  _gameOver() {
    this.state = STATE.GAMEOVER;
    this._endTime = this.elapsed;
    this.shakeTimer = 0.4; // 충돌 화면 흔들림
    this.audio.play('hit');
    this.audio.stopBgm();
    this._saveBest();
    this._syncOverlay();
  }

  _clear() {
    this.state = STATE.CLEAR;
    this._endTime = this.elapsed;
    this.audio.play('clear');
    this.audio.stopBgm();
    this._saveBest();
    this._syncOverlay();
  }

  _saveBest() {
    const s = Math.floor(this.score);
    this.isNewBest = s > this.best && s > 0;
    if (this.isNewBest) {
      this.best = s;
      localStorage.setItem(CONFIG.STORAGE_BEST, String(s));
    }
  }

  // ----- update -----
  _loop(now) {
    const dt = Math.min((now - this._lastTime) / 1000 || 0, 0.05);
    this._lastTime = now;
    this.elapsed += dt;
    this._update(dt);
    this._draw();
    requestAnimationFrame(this._bound);
  }

  _update(dt) {
    if (this.state === STATE.STAGE_CARD) {
      this.cardTimer += dt;
      if (this.cardTimer > 1.0) { this.state = STATE.PLAY; this._syncOverlay(); }
      return;
    }
    if (this.state !== STATE.PLAY) {
      this._updateParticles(dt);
      return;
    }

    // 점수 & 속도 (무한질주는 공통 난이도 적용) — 속도는 화면 너비에 비례 스케일
    this.score += CONFIG.SCORE_PER_SEC * dt;
    const diff = this.endless ? CONFIG.ENDLESS : this.stage;
    this.speed = Math.min(
      this.speed + diff.speedGrowth * this.scale * dt,
      diff.maxSpeed * this.scale
    );
    this.stageRenderer.update(dt, this.speed);
    this.player.update(dt);

    // 무대 전환 체크 (무한 주행 모드에서는 비활성)
    if (!this.endless && this.score >= CONFIG.STAGE_THRESHOLDS[this.stageIndex]) {
      this._advanceStage();
      return;
    }

    // 장애물 스폰
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0;
      const [mn, mx] = (this.endless ? CONFIG.ENDLESS : this.stage).obstacleGap;
      this.nextSpawn = mn + Math.random() * (mx - mn);
      const kind = Math.random() < CONFIG.BIRD_CHANCE ? 'bird' : 'ground';
      this.obstacles.push(new Obstacle(this, { kind }));
    }

    // 코인 스폰 (장애물과 독립 타이머 + 랜덤 위치, 장애물과 최소 간격 보장)
    this.coinTimer += dt;
    if (this.coinTimer >= this.nextCoin) {
      this.coinTimer = 0;
      const [cmn, cmx] = CONFIG.COIN_INTERVAL;
      this.nextCoin = cmn + Math.random() * (cmx - cmn);
      this._spawnCoin();
    }

    // 장애물 업데이트 & 충돌
    const pb = this.player.getHitbox();
    for (const o of this.obstacles) {
      o.update(dt, this.speed);
      if (this._hit(pb, o.getHitbox())) { this._gameOver(); return; }
    }
    this.obstacles = this.obstacles.filter((o) => !o.dead);

    // 코인 업데이트 & 획득
    for (const c of this.coins) {
      c.update(dt, this.speed);
      if (!c.dead && this._hit(pb, c.getHitbox())) {
        c.dead = true;
        this.score += CONFIG.COIN_BONUS;
        this.coinsCollected++;
        this.audio.play('coin');
        this._burst(c.x, c.y, CONFIG.COLORS.ORANGE);
      }
    }
    this.coins = this.coins.filter((c) => !c.dead);

    this._updateParticles(dt);
  }

  _hit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // 코인을 화면 오른쪽 밖 랜덤 x에 생성하되, 장애물/코인과 최소 간격을 확보
  _spawnCoin() {
    const s = this.scale;
    const minGap = CONFIG.COIN_MIN_GAP * s;
    let x = this.width + (40 + Math.random() * 240) * s;
    for (let tries = 0; tries < 10; tries++) {
      let conflict = false;
      for (const o of this.obstacles) {
        if (Math.abs(x - (o.x + o.w / 2)) < minGap) {
          x = o.x + o.w / 2 + minGap + Math.random() * 80 * s; conflict = true; break;
        }
      }
      if (!conflict) {
        for (const c of this.coins) {
          if (Math.abs(x - c.x) < 80 * s) { x = c.x + 100 * s; conflict = true; break; }
        }
      }
      if (!conflict) break;
    }
    this.coins.push(new Coin(this, x));
  }

  _burst(x, y, color) {
    const v = 160 * this.scale;
    for (let i = 0; i < 12; i++) {
      const ang = (Math.PI * 2 * i) / 12;
      this.particles.push({
        x, y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
        life: 0.5, color,
      });
    }
  }

  _updateParticles(dt) {
    const grav = 400 * this.scale;
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += grav * dt; p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.shakeTimer > 0) this.shakeTimer = Math.max(0, this.shakeTimer - dt);
  }

  // ----- draw -----
  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 화면 흔들림(충돌 시) — 월드 전체에 적용
    let shook = false;
    if (this.shakeTimer > 0) {
      const m = this.shakeTimer * 22 * this.scale;
      ctx.save();
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
      shook = true;
    }

    if (this.state === STATE.LOADING) {
      ctx.fillStyle = CONFIG.COLORS.BLUE;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('불러오는 중…', this.width / 2, this.height / 2);
      return;
    }

    // 배경 (타이틀 포함 1단계 배경)
    this.stageRenderer.draw(ctx, this.stage);

    if (this.state === STATE.PLAY || this.state === STATE.STAGE_CARD || this.state === STATE.GAMEOVER) {
      this.coins.forEach((c) => c.draw(ctx));
      this.obstacles.forEach((o) => o.draw(ctx));
      this.player.draw(ctx);
      this._drawParticles(ctx);
      this._drawHUD(ctx);
    }

    if (this.state === STATE.STAGE_CARD) this._drawStageCard(ctx);

    if (shook) ctx.restore();
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 0.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
  }

  // UI(글자/여백)용 클램프 스케일 — 너무 작아지거나 커지지 않도록
  _ui() { return Math.max(0.7, Math.min(1.3, this.scale)); }

  _drawHUD(ctx) {
    const face = this.assets['icon_face'];
    const logo = this.assets['logo_title'];
    const u = this._ui();
    const pad = 16 * u;
    ctx.save();
    // 우상단 CI 로고(점수 위에 고정)
    let scoreTop = pad + 24 * u;
    if (logo && logo.complete && logo.naturalWidth) {
      const lw = Math.min(this.width * 0.42, 200 * u);
      const lh = lw * logo.naturalHeight / logo.naturalWidth;
      ctx.drawImage(logo, this.width - pad - lw, pad, lw, lh);
      scoreTop = pad + lh + 22 * u;   // 점수를 로고 아래로
    }
    // 점수 (우상단, 로고 아래)
    ctx.textAlign = 'right';
    ctx.font = `bold ${Math.round(26 * u)}px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = CONFIG.COLORS.BLUE;
    ctx.fillText(String(Math.floor(this.score)).padStart(5, '0'), this.width - pad, scoreTop);
    ctx.font = `${Math.round(13 * u)}px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = 'rgba(10,42,112,0.7)';
    ctx.fillText('BEST ' + this.best, this.width - pad, scoreTop + 20 * u);
    // 무대 (좌상단)
    ctx.textAlign = 'left';
    const ic = 34 * u;
    if (face && face.complete) ctx.drawImage(face, pad, pad, ic, ic * face.naturalHeight / face.naturalWidth);
    ctx.font = `bold ${Math.round(16 * u)}px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = CONFIG.COLORS.BLUE;
    const label = this.endless ? `무한질주 · ${this.stage.name}` : `STAGE ${this.stage.id} · ${this.stage.name}`;
    ctx.fillText(label, pad + ic + 8, pad + 22 * u);
    ctx.restore();
  }

  _drawStageCard(ctx) {
    const u = this._ui();
    const a = Math.min(1, this.cardTimer / 0.2) * Math.min(1, (1.0 - this.cardTimer) / 0.2 + 0.8);
    ctx.save();
    ctx.globalAlpha = Math.min(0.92, a);
    ctx.fillStyle = CONFIG.COLORS.BLUE;
    const cardH = 150 * u;
    ctx.fillRect(0, this.height / 2 - cardH / 2, this.width, cardH);
    ctx.fillStyle = CONFIG.COLORS.ORANGE;
    ctx.fillRect(0, this.height / 2 - cardH / 2, this.width, 6 * u);
    ctx.globalAlpha = Math.min(1, a + 0.1);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(40 * u)}px "Noto Sans KR", sans-serif`;
    ctx.fillText(`STAGE ${this.stage.id} · ${this.stage.name}`, this.width / 2, this.height / 2 - 6 * u);
    ctx.font = `${Math.round(18 * u)}px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = CONFIG.COLORS.SKYBLUE;
    ctx.fillText(`[${this.stage.subtitle}] ${this.stage.intro}`, this.width / 2, this.height / 2 + 30 * u);
    ctx.restore();
  }

  // DOM 오버레이(타이틀/오버/클리어) 동기화는 ui.js가 담당
  _syncOverlay() {
    if (window.UI) window.UI.sync(this);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const game = new Game(canvas);
  window.GAME = game;
  if (window.UI) window.UI.init(game);
  // 상태 변화 폴링으로 오버레이 갱신
  let last = null;
  setInterval(() => {
    if (game.state !== last) { last = game.state; game._syncOverlay(); }
  }, 80);
});
