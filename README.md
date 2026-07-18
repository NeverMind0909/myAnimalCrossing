# 모동숲 주민 관리

아이폰 브라우저에서도 사용할 수 있는 정적 HTML 앱입니다.

## 실행

`index.html`을 브라우저로 열면 됩니다. 주민 데이터는 실행 시 원격 API에서 받아오고, 받아온 데이터는 `localStorage`에 하루 동안 캐시합니다.

## 데이터 방식

- 기본 391명: `alexislours/ACNHAPI`의 `villagers.json`
- 2.0/Sanrio 추가 22명: Nookipedia MediaWiki API의 각 주민 페이지 위키텍스트
- 이미지: 기본 주민은 `alexislours/ACNHAPI`, 추가 주민은 Nookipedia 파일 리다이렉트
- 내가 보유한 주민 목록: `localStorage`
- API 실패 시: 마지막 캐시를 사용하고, 캐시도 없으면 로컬 `villagers.json`, 그것도 실패하면 샘플 데이터로 동작합니다.

정상 로딩되면 총 413명이 표시됩니다.

## 친구에게 공유하기

카카오톡으로 쉽게 공유하려면 GitHub Pages, Netlify, Vercel 같은 정적 호스팅에 올린 뒤 URL 하나를 보내는 것을 추천합니다.

## 무값 예측기

상단의 `무값 예측기` 버튼은 Turnip Prophet으로 연결됩니다.
