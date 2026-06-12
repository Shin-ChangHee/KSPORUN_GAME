# 달려라 백호돌이 — 게임 에셋

원본 PNG 11종을 전처리한 결과물입니다.
- 투명 배경(테두리 연결 배경만 flood-fill 제거), 내용 경계로 크롭 완료
- 검정 배경 컷은 외곽선 복원 처리
- 측면 컷(달리기/자전거)은 진행 방향(우향)으로 수평 반전 완료
- 캐릭터 스프라이트 최대 512px, 얼굴 아이콘 256px

| 파일 | 게임 내 역할 |
|------|--------------|
| player_run.png | 1단계 주인공(달리기). 위아래 바운스로 달리기 표현 |
| player_bike.png | 2단계 주인공(자전거) |
| mascot_cycle_kspo.png | 2단계 전환 카드 / KSPO 브랜딩 |
| mascot_bike_front.png | 보조/대체 컷 |
| title_suit.png | 타이틀 화면 대표 캐릭터 |
| title_trench.png | 타이틀/로딩 플레이버 |
| clear_sparkle.png | 클리어 축하 |
| clear_cool.png | 클리어 축하(대체) |
| gameover_peace.png | 게임오버 리액션 |
| value_meditation.png | 경영방침(존중·조화) 상징 / 로딩 |
| icon_face.png | UI 아이콘·점수·파비콘·수집 코인 베이스 |

※ 3단계 보트 포즈는 원본에 없어 미포함. 캔버스로 보트를 그리고 위 스프라이트(예: icon_face 또는 player_bike 상체)를 합성하세요.
