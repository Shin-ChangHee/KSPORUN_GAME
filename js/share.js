/**
 * share.js — 결과 공유 (0단계, 백엔드 없음)
 * ① 결과 화면을 캔버스 이미지로 캡처 → 저장/SNS 공유 (Web Share API 지원 시)
 * ② 점수를 URL 파라미터로 담아 "내 점수 깨봐!" 링크 공유
 */
const Share = {
  // 결과 카드 이미지를 생성 (캔버스)
  buildResultImage(game) {
    const c = document.createElement('canvas');
    c.width = 600; c.height = 400;
    const ctx = c.getContext('2d');
    const C = CONFIG.COLORS;
    // 배경
    const g = ctx.createLinearGradient(0, 0, 0, 400);
    g.addColorStop(0, C.BLUE); g.addColorStop(1, C.SKYBLUE);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = C.ORANGE; ctx.fillRect(0, 0, 600, 8);
    // 텍스트
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px "Noto Sans KR", sans-serif';
    ctx.fillText('달려라 백호돌이', 300, 70);
    const cleared = game.state === STATE.CLEAR;
    ctx.font = 'bold 20px "Noto Sans KR", sans-serif';
    ctx.fillStyle = C.ORANGE;
    const stageId = (game.stage && game.stage.id) || 1;
    ctx.fillText(cleared ? '🏆 완주 성공!' : `STAGE ${stageId} 도달`, 300, 120);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px "Noto Sans KR", sans-serif';
    ctx.fillText(String(Math.floor(game.score)), 300, 210);
    ctx.font = '18px "Noto Sans KR", sans-serif';
    ctx.fillText(`컬러볼 ${game.coinsCollected}개 · 최고 ${game.best}`, 300, 250);
    // 캐릭터
    const key = cleared ? 'clear_sparkle' : 'gameover_peace';
    const img = game.assets[key];
    if (img && img.complete) {
      const h = 150, w = h * img.naturalWidth / img.naturalHeight;
      ctx.drawImage(img, 300 - w / 2, 250, w, h);
    }
    ctx.font = '14px "Noto Sans KR", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText('국민 모두가 평생 즐기는 K-스포츠 허브', 300, 388);
    return c;
  },

  async shareResult(game) {
    const url = new URL(location.href);
    url.searchParams.set('score', Math.floor(game.score));
    const urlStr = url.toString();
    const text = `달려라 백호돌이에서 ${Math.floor(game.score)}점! 내 점수 깨봐 🐯`;

    // 결과 이미지는 미리보기 용도로만 생성(저장 기능 없이) — 실패해도 링크 공유는 가능
    let dataURL = null;
    try {
      dataURL = this.buildResultImage(game).toDataURL('image/png');
    } catch (e) { /* 무시 */ }

    // ① Web Share API(모바일) — 링크/텍스트 공유
    if (navigator.share) {
      try {
        await navigator.share({ title: '달려라 백호돌이', text, url: urlStr });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // 사용자가 공유 취소
      }
    }
    // ② 폴백(PC·인앱 브라우저): 점수 미리보기 + 공유 링크 복사
    this._showFallbackModal(dataURL, urlStr);
  },

  // Web Share 미지원(PC·인앱 브라우저) 폴백 — 점수 미리보기 + 링크 복사
  _showFallbackModal(dataURL, urlStr) {
    // 기존 모달 제거
    const prev = document.getElementById('share-modal');
    if (prev) prev.remove();

    const C = (typeof CONFIG !== 'undefined' && CONFIG.COLORS) || { BLUE: '#0A2A70', ORANGE: '#FF7F00', WHITE: '#fff' };
    const ov = document.createElement('div');
    ov.id = 'share-modal';
    ov.setAttribute('style', [
      'position:fixed', 'inset:0', 'z-index:9999',
      'background:rgba(0,0,0,0.62)', 'display:flex',
      'align-items:center', 'justify-content:center', 'padding:18px',
      'box-sizing:border-box', 'backdrop-filter:blur(2px)',
    ].join(';'));

    const card = document.createElement('div');
    card.setAttribute('style', [
      'background:#fff', 'border-radius:16px', 'max-width:380px', 'width:100%',
      'max-height:90vh', 'overflow:auto', 'padding:18px',
      'box-shadow:0 12px 40px rgba(0,0,0,0.35)', 'text-align:center',
      'font-family:"Noto Sans KR",sans-serif',
    ].join(';'));

    const h = document.createElement('div');
    h.textContent = '결과 공유';
    h.setAttribute('style', `font-weight:800;font-size:18px;color:${C.BLUE};margin-bottom:10px`);
    card.appendChild(h);

    if (dataURL) {
      const img = document.createElement('img');
      img.src = dataURL;
      img.setAttribute('style', 'width:100%;border-radius:10px;display:block;margin:0 auto 8px');
      card.appendChild(img);
    }
    const hint = document.createElement('div');
    hint.textContent = '아래 링크를 복사해 친구에게 공유하고 점수를 겨뤄보세요!';
    hint.setAttribute('style', 'font-size:12.5px;color:#666;margin:8px 0 12px;line-height:1.45');
    card.appendChild(hint);

    const btnStyle = (bg, fg) => [
      'display:block', 'width:100%', 'box-sizing:border-box', 'border:none',
      'border-radius:10px', 'padding:13px', 'font-size:15px', 'font-weight:700',
      'cursor:pointer', 'margin-bottom:8px', `background:${bg}`, `color:${fg}`,
      'font-family:inherit',
    ].join(';');

    // 링크 복사
    const copy = document.createElement('button');
    copy.textContent = '🔗 공유 링크 복사';
    copy.setAttribute('style', btnStyle(C.BLUE, '#fff'));
    copy.addEventListener('click', async () => {
      let ok = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(urlStr); ok = true;
        }
      } catch (e) { /* 폴백 아래 */ }
      if (!ok) {
        // execCommand 폴백
        const ta = document.createElement('textarea');
        ta.value = urlStr; ta.setAttribute('style', 'position:fixed;opacity:0');
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (e) {}
        ta.remove();
      }
      copy.textContent = ok ? '✅ 링크 복사됨!' : '🔗 ' + urlStr;
    });
    card.appendChild(copy);

    // 닫기
    const close = document.createElement('button');
    close.textContent = '닫기';
    close.setAttribute('style', btnStyle('#eee', '#333') + ';margin-bottom:0');
    close.addEventListener('click', () => ov.remove());
    card.appendChild(close);

    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.appendChild(card);
    document.body.appendChild(ov);
  },

  // URL에 ?score= 가 있으면 "도전 대상 점수"로 반환
  getChallengeScore() {
    const s = new URL(location.href).searchParams.get('score');
    return s ? parseInt(s, 10) : null;
  },
};
