/**
 * config.js — 달려라 백호돌이
 * 색상 · 속도 · 점수 · 키워드 · 무대 전환 임계값 등 모든 튜닝 상수를 모아둔 파일.
 * 비개발자도 이 파일만 수정하면 게임 밸런스를 바꿀 수 있습니다.
 */
const CONFIG = {
  // --- CI 컬러 (확정) ---
  COLORS: {
    BLUE:    '#0A2A70',
    SKYBLUE: '#1B99C4',
    ORANGE:  '#FF7F00',
    WHITE:   '#FFFFFF',
    INK:     '#1A1A1A',
  },

  // --- 캔버스 기준 해상도 (실제 표시는 반응형으로 스케일) ---
  BASE_WIDTH: 960,
  BASE_HEIGHT: 540,
  GROUND_RATIO: 0.82, // 지면 y 위치 비율 (캔버스 높이 기준)

  // --- 물리 ---
  GRAVITY: 2600,          // px/s^2
  JUMP_VELOCITY: -950,    // px/s (점프 초기 속도)
  MAX_FALL_SPEED: 2000,

  // --- 점프 손맛(게임필) 튜닝 ---
  JUMP_CUT: 0.42,         // 버튼을 일찍 떼면 상승 속도를 이 비율로 잘라 낮게 점프(가변 점프)
  COYOTE_TIME: 0.09,      // 지면을 막 벗어난 직후에도 점프 허용(초)
  JUMP_BUFFER: 0.12,      // 착지 직전에 누른 점프 입력을 기억하는 시간(초)
  START_GRACE: 1.1,       // 플레이 시작 후 첫 장애물 등장까지 유예(초)

  // --- 점수 ---
  SCORE_PER_SEC: 100,     // 거리(시간) 기반 자동 점수 (초당)
  COIN_BONUS: 50,         // 코인 1개 획득 보너스

  // --- 무대 전환 점수 기준 (config에서 조정) ---
  STAGE_THRESHOLDS: [500, 1200, 2000], // 1→2, 2→3, 3→클리어

  // --- 무대별 설정 ---
  STAGES: [
    {
      id: 1,
      name: '올림픽공원',
      subtitle: '달리기',
      intro: '세계평화의문을 지나 힘차게 달려요',
      speed: 420,           // px/s 시작 스크롤 속도
      speedGrowth: 14,      // 초당 속도 증가
      maxSpeed: 720,        // 이 무대 최고 속도 상한
      obstacleGap: [1.1, 1.9], // 장애물 생성 간격(초) [min, max]
      sky: '#BfE3F2',
      skyBottom: '#EAF7FC',
      ground: '#7FB069',
      groundDark: '#5E9150',
      accent: '#1B99C4',
    },
    {
      id: 2,
      name: '스피돔(경륜)',
      subtitle: '자전거',
      intro: '뱅크를 질주하는 스피드의 무대',
      speed: 560,
      speedGrowth: 18,
      maxSpeed: 920,
      obstacleGap: [0.9, 1.6],
      sky: '#FFE2B8',
      skyBottom: '#FFF1DA',
      ground: '#C49A6C',
      groundDark: '#9C7649',
      accent: '#FF7F00',
    },
    {
      id: 3,
      name: '미사 경정장(경정)',
      subtitle: '모터보트',
      intro: '물살을 가르는 클라이맥스!',
      speed: 700,
      speedGrowth: 22,
      maxSpeed: 1120,
      obstacleGap: [0.8, 1.4],
      sky: '#A9D6E5',
      skyBottom: '#D6F0F7',
      ground: '#2E78B5',
      groundDark: '#1B5E8C',
      accent: '#0A2A70',
    },
  ],

  // --- 핵심가치 ↔ 장애물(극복 대상) 매핑 ---
  OBSTACLE_KEYWORDS: ['안일', '무기력', '비효율', '은폐'],
  BIRD_CHANCE: 0.32,       // 장애물 생성 시 '날아오는 새'로 등장할 확률

  // --- 경영방침 = 수집 코인 ---
  COIN_KEYWORDS: ['존중', '조화', '정정당당'],
  COIN_INTERVAL: [1.1, 2.6], // 코인 생성 간격(초) [min, max] — 장애물과 독립
  COIN_MIN_GAP: 120,         // 장애물과의 최소 수평 간격(px, 스케일 적용 전)

  // --- 경영가치 문구 ---
  VALUES: {
    mission: '스포츠로 국민이 건강하고 행복한 삶을 누리는 데 이바지',
    vision: '국민 모두가 평생 즐기는 K-스포츠 허브',
    core: ['탁월', '열정', '실용', '투명'],
    policy: ['존중', '조화', '정정당당'],
  },

  // --- 저장 키 ---
  STORAGE_BEST: 'bhd_runner_best',
  STORAGE_MUTE: 'bhd_runner_mute',
};
