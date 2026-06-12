/**
 * leaderboard.js — (선택 모듈, 기본 비활성)
 * 통합 온라인 랭킹이 필요할 때만 활성화. 본체(game.js) 수정 없이 on/off 가능.
 *
 * 활성화 방법:
 *   1) ENABLED = true 로 변경
 *   2) BACKEND 설정 (Firebase Firestore / Supabase 등 관리형 BaaS) 작성
 *   3) submitScore() / fetchTop() 구현 채우기
 *
 * 주의(기획서 7-2단계):
 *   - 클라이언트 게임은 점수 위조가 쉬움 → 닉네임 + 최소 검증
 *   - 외부 공개 시 개인정보(닉네임 등) 최소 수집·안내
 *   - 무료 한도 초과 시 비용 발생
 */
const Leaderboard = {
  ENABLED: false,

  async submitScore(nickname, score) {
    if (!this.ENABLED) return;
    // TODO: BaaS 연동 (예: Firestore add doc)
    console.warn('[leaderboard] disabled — submitScore no-op');
  },

  async fetchTop(limit = 10) {
    if (!this.ENABLED) return [];
    // TODO: BaaS 연동 (예: Firestore query orderBy score desc limit)
    return [];
  },
};
