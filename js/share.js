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
    ctx.fillText(cleared ? '🏆 완주 성공!' : `STAGE ${game.stage.id} 도달`, 300, 120);
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

  // dataURL → Blob (동기 변환) : toBlob 비동기 콜백에서 사용자 제스처 활성화가
  // 만료돼 navigator.share/클립보드가 차단되는 문제를 피하기 위함
  _dataURLtoBlob(dataURL) {
    const [head, body] = dataURL.split(',');
    const mime = (head.match(/:(.*?);/) || [])[1] || 'image/png';
    const bin = atob(body);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  },

  _download(blob, name) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 4000);
  },

  async shareResult(game) {
    const url = new URL(location.href);
    url.searchParams.set('score', Math.floor(game.score));
    const text = `달려라 백호돌이에서 ${Math.floor(game.score)}점! 내 점수 깨봐 🐯`;

    let blob = null, file = null;
    try {
      const canvas = this.buildResultImage(game);
      // 동기적으로 Blob 생성 → 사용자 제스처(클릭) 활성화 유지
      blob = this._dataURLtoBlob(canvas.toDataURL('image/png'));
      file = new File([blob], 'baekhodori_score.png', { type: 'image/png' });
    } catch (e) { /* 이미지 생성 실패해도 링크 공유는 가능하게 진행 */ }

    // ① Web Share API — 파일 공유(모바일 우선)
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text, url: url.toString() });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // 사용자가 공유 취소
      }
    }
    // ② 파일 공유 미지원 환경 — 텍스트/링크만 공유
    if (navigator.share) {
      try {
        await navigator.share({ title: '달려라 백호돌이', text, url: url.toString() });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    // ③ 폴백(PC 등): 이미지 다운로드 + 링크 클립보드 복사
    if (blob) this._download(blob, 'baekhodori_score.png');
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url.toString());
        copied = true;
      }
    } catch (e) { /* 무시 */ }
    const msg = blob ? '결과 이미지를 저장했어요!\n' : '';
    alert(msg + (copied
      ? '공유 링크가 클립보드에 복사되었습니다.'
      : '공유 링크: ' + url.toString()));
  },

  // URL에 ?score= 가 있으면 "도전 대상 점수"로 반환
  getChallengeScore() {
    const s = new URL(location.href).searchParams.get('score');
    return s ? parseInt(s, 10) : null;
  },
};
