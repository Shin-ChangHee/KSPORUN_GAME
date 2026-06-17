/**
 * ui.js — DOM 오버레이 화면 (타이틀 / 게임오버 / 클리어)
 * 캔버스 위에 HTML 레이어를 띄워 경영가치 문구·버튼을 표시.
 */
const UI = {
  init(game) {
    this.game = game;
    this.el = {
      title: document.getElementById('screen-title'),
      over: document.getElementById('screen-over'),
      clear: document.getElementById('screen-clear'),
    };
    // 타이틀 캐릭터 이미지 세팅
    const ts = document.getElementById('title-char');
    if (ts) ts.src = 'assets/images/title_suit.png';
    // 도전 점수 안내
    const ch = Share.getChallengeScore && Share.getChallengeScore();
    if (ch && document.getElementById('challenge-note')) {
      document.getElementById('challenge-note').textContent =
        `🎯 도전 점수: ${ch}점 — 이 점수를 넘어보세요!`;
    }
    // 최고점
    const tb = document.getElementById('title-best');
    if (tb) tb.textContent = `내 최고점: ${game.best}`;
  },

  sync(game) {
    if (!this.el) return;
    const s = game.state;
    this._toggle(this.el.title, s === STATE.TITLE);
    this._toggle(this.el.over, s === STATE.GAMEOVER);
    this._toggle(this.el.clear, s === STATE.CLEAR);

    if (s === STATE.GAMEOVER) {
      this._set('over-score', Math.floor(game.score));
      this._set('over-sub', game.endless
        ? `무한질주 종료! · 최고 ${game.best}`
        : `도달: STAGE ${game.stage.id} · ${game.stage.name} · 최고 ${game.best}`);
      this._set('over-newbest', game.isNewBest ? '🎉 신기록 달성!' : '');
      this._set('over-challenge', this._challengeMsg(game));
      this._setImg('over-char', 'gameover_peace');
    }
    if (s === STATE.CLEAR) {
      this._set('clear-score', Math.floor(game.score));
      this._set('clear-coins', game.coinsCollected);
      this._set('clear-newbest', game.isNewBest ? '🎉 신기록 달성!' : '');
      this._setImg('clear-char', 'clear_sparkle');
    }
    if (s === STATE.TITLE) {
      this._set('title-best', `내 최고점: ${game.best}`);
    }
  },

  // 공유 링크로 들어온 도전 점수와 비교한 메시지
  _challengeMsg(game) {
    const ch = Share.getChallengeScore && Share.getChallengeScore();
    if (!ch) return '';
    const me = Math.floor(game.score);
    if (me > ch) return `🏅 도전 점수 ${ch}점 돌파!`;
    return `🎯 도전 점수까지 ${ch - me}점!`;
  },

  _toggle(el, show) {
    if (el) el.style.display = show ? 'flex' : 'none';
  },
  _set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  },
  _setImg(id, key) {
    const el = document.getElementById(id);
    if (el) el.src = 'assets/images/' + key + '.png';
  },
};
window.UI = UI;
