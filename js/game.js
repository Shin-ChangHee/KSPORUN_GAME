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
  icon_face: 'assets/images/icon_face.png',
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
    this.cardTimer = 0;
    this.elapsed = 0;
    this.coinsCollected = 0;

    this._lastTime = 0;
    this._bound = this._loop.bind(this);

    this._setupCanvas();
    this._bindInput();
    this._loadAssets();
  }

  _setupCanvas() {
    const resize = () => {
      const wrap = this.canvas.parentElement;
      const maxW = wrap.clientWidth;
      const maxH = wrap.clientHeight;
      const ratio = CONFIG.BASE_WIDTH / CONFIG.BASE_HEIGHT;
      let w = maxW, h = maxW / ratio;
      if (h > maxH) { h = maxH; w = maxH * ratio; }
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
      this.canvas.width = CONFIG.BASE_WIDTH * this.dpr;
      this.canvas.height = CONFIG.BASE_HEIGHT * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
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
      img.src = ASSET_FILES[k];
      this.assets[k] = img;
    });
  }

  _onReady() {
    this.state = STATE.TITLE;
    requestAnimationFrame(this._bound);
  }

  _bindInput() {
    const action = (e) => {
      this.audio.unlock();
      if (e.type === 'keydown') {
        if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); this._press(); }
        return;
      }
      e.preventDefault();
      this._press();
    };
    window.addEventListener('keydown', action);
    this.canvas.addEventListener('pointerdown', action);

    // UI 버튼
    document.addEventListener('click', (e) => {
      const id = e.target.id;
      if (id === 'btn-mute') {
        this.audio.unlock();
        const muted = this.audio.toggleMute();
        e.target.textContent = muted ? '🔇' : '🔊';
      } else if (id === 'btn-restart' || id === 'btn-replay') {
        this.audio.unlock();
        this._startGame();
      } else if (e.target.classList && e.target.classList.contains('js-share')) {
        Share.shareResult(this);
      }
    });
  }

  _press() {
    switch (this.state) {
      case STATE.TITLE: this._startGame(); break;
      case STATE.PLAY: this.player.jump(); break;
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
    this.coinsCollected = 0;
    this.player.reset();
    this._showCard(0);
    this.audio.startBgm();
  }

  _showCard(index) {
    this.stageIndex = index;
    this.stage = CONFIG.STAGES[index];
    this.speed = this.stage.speed;
    this.state = STATE.STAGE_CARD;
    this.cardTimer = 0;
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
    if (s > this.best) {
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

    // 점수 & 속도
    this.score += CONFIG.SCORE_PER_SEC * dt;
    this.speed += this.stage.speedGrowth * dt;
    this.stageRenderer.update(dt, this.speed);
    this.player.update(dt);

    // 무대 전환 체크
    if (this.score >= CONFIG.STAGE_THRESHOLDS[this.stageIndex]) {
      this._advanceStage();
      return;
    }

    // 스폰
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.nextSpawn) {
      this.spawnTimer = 0;
      const [mn, mx] = this.stage.obstacleGap;
      this.nextSpawn = mn + Math.random() * (mx - mn);
      this.obstacles.push(new Obstacle(this));
      if (Math.random() < CONFIG.COIN_SPAWN_CHANCE) {
        this.coins.push(new Coin(this, this.width + 120 + Math.random() * 80));
      }
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

  _burst(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const ang = (Math.PI * 2 * i) / 12;
      this.particles.push({
        x, y, vx: Math.cos(ang) * 160, vy: Math.sin(ang) * 160,
        life: 0.5, color,
      });
    }
  }

  _updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  // ----- draw -----
  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

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
    if (this.state === STATE.PLAY) {} // overlay via DOM
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 0.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
  }

  _drawHUD(ctx) {
    const face = this.assets['icon_face'];
    ctx.save();
    // 점수 (우상단)
    ctx.textAlign = 'right';
    ctx.font = 'bold 26px "Noto Sans KR", sans-serif';
    ctx.fillStyle = CONFIG.COLORS.BLUE;
    ctx.fillText(String(Math.floor(this.score)).padStart(5, '0'), this.width - 20, 40);
    ctx.font = '13px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(10,42,112,0.7)';
    ctx.fillText('BEST ' + this.best, this.width - 20, 60);
    // 무대 (좌상단)
    ctx.textAlign = 'left';
    if (face && face.complete) ctx.drawImage(face, 16, 16, 34, 34 * face.naturalHeight / face.naturalWidth);
    ctx.font = 'bold 16px "Noto Sans KR", sans-serif';
    ctx.fillStyle = CONFIG.COLORS.BLUE;
    ctx.fillText(`STAGE ${this.stage.id} · ${this.stage.name}`, 58, 38);
    ctx.restore();
  }

  _drawStageCard(ctx) {
    const a = Math.min(1, this.cardTimer / 0.2) * Math.min(1, (1.0 - this.cardTimer) / 0.2 + 0.8);
    ctx.save();
    ctx.globalAlpha = Math.min(0.92, a);
    ctx.fillStyle = CONFIG.COLORS.BLUE;
    const cardH = 150;
    ctx.fillRect(0, this.height / 2 - cardH / 2, this.width, cardH);
    ctx.fillStyle = CONFIG.COLORS.ORANGE;
    ctx.fillRect(0, this.height / 2 - cardH / 2, this.width, 6);
    ctx.globalAlpha = Math.min(1, a + 0.1);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px "Noto Sans KR", sans-serif';
    ctx.fillText(`STAGE ${this.stage.id} · ${this.stage.name}`, this.width / 2, this.height / 2 - 6);
    ctx.font = '18px "Noto Sans KR", sans-serif';
    ctx.fillStyle = CONFIG.COLORS.SKYBLUE;
    ctx.fillText(`[${this.stage.subtitle}] ${this.stage.intro}`, this.width / 2, this.height / 2 + 30);
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
