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

  async shareResult(game) {
    const canvas = this.buildResultImage(game);
    const url = new URL(location.href);
    url.searchParams.set('score', Math.floor(game.score));
    const text = `달려라 백호돌이에서 ${Math.floor(game.score)}점! 내 점수 깨봐 🐯`;

    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'baekhodori_score.png', { type: 'image/png' });
      // Web Share API (모바일)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text, url: url.toString() });
          return;
        } catch (e) { /* 취소 시 폴백 */ }
      }
      // 폴백: 이미지 다운로드 + 링크 클립보드 복사
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'baekhodori_score.png';
      a.click();
      try {
        await navigator.clipboard.writeText(url.toString());
        alert('결과 이미지를 저장했어요!\n공유 링크가 클립보드에 복사되었습니다.');
      } catch (e) {
        alert('결과 이미지를 저장했어요!');
      }
    }, 'image/png');
  },

  // URL에 ?score= 가 있으면 "도전 대상 점수"로 반환
  getChallengeScore() {
    const s = new URL(location.href).searchParams.get('score');
    return s ? parseInt(s, 10) : null;
  },
};
