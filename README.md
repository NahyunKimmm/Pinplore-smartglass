# Pinplore · Smart glass prototype

스마트글래스 뷰 인터랙션 프로토타입 쇼케이스. 아이패드 프로 11인치 가로(1210×834) 기준.

**Live:** https://nahyunkimmm.github.io/Pinplore-smartglass/

## 플로우
| 헤더 탭 | 플로우 | 파일 |
|---|---|---|
| 나침반 | 익스플로어 — 핀 열기 → 시선 이동 → 카드가 핀으로 접히며 닫힘 → 주변 핀 리스트 | `explore/index.html` |
| + | 핀 작성 — 카테고리 선택 → 핀 드래그 → 딕테이션 → Drop Pin | `pin/index.html` |
| 경로 | 경로 생성 — 테마 선택 → Create route → 핀 추가 → 경로 재생성 → Navigate로 첫 장소 안내 | `route/index.html` |
| 북마크 | 컬렉션 → 네비게이션 | `nav/index.html` |

## 사용법
- 기본: 4개 플로우가 자동으로 이어서 반복 재생
- 상단 AR 헤더의 탭을 누르면 해당 플로우 재생
- 화면을 탭하면 하단에 플로우 선택 · 일시정지 · 전체 화면 버튼 표시
- 각 플로우는 단독으로도 열 수 있음 (Space: 재생/일시정지, R: 처음부터)

## 배포
`main`에 push하면 GitHub Actions가 GitHub Pages로 자동 배포합니다.
로컬 확인: `npx serve .` 후 브라우저에서 열기 (파일을 직접 열면 iframe이 막힐 수 있음).
