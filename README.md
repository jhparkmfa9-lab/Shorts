# 10월의 고요함을 깨는 쇼츠 🎃

30초 세로 쇼츠(1080×1920). 화면은 전부 코드로 그린 점묘화, 음악도 코드로 합성했습니다. [HyperFrames](https://github.com/heygen-com/hyperframes)로 렌더링.

▶ 완성 영상: [october-shorts-upload.mp4](october-shorts-upload.mp4)

| 시간 | 장면 |
|---|---|
| 0–3초 | 고요한 밤, 떨어지는 단풍잎 · "10월의 고요함..." "쉿." |
| 3–10초 | 비트 드롭! 통통 튀는 호박 · "10월이 조용하다고?" → "응 아니야~" |
| 10–17초 | 단풍잎 비 + 선글라스 낀 해 · "가을 텐션 UP UP!" |
| 17–24초 | 춤추는 유령 셋 · "할로윈 D-1" |
| 24–30초 | 무지개 점 · "10월 끝까지 신나게!" → "좋아요 꾹!" |

## 파일

- `index.html` — HyperFrames 컴포지션. 캔버스에 시간 `t`의 순수 함수로 점을 그림 (GSAP 타임라인으로 시크)
- `make-music.js` — 120BPM 쿵짝 베이스, 피치카토, 카주 멜로디, 띠용·슬라이드 휘슬을 합성해 `music.wav` 생성

## 다시 만들기

Node.js 22+, FFmpeg 필요.

```bash
node make-music.js
npx hyperframes render -o october-shorts.mp4
```
