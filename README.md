# 모동숲 주민 관리

아이폰 브라우저에서도 사용할 수 있는 정적 HTML 앱입니다.

## 실행

`index.html`을 브라우저로 열면 됩니다. 주민 데이터는 실행 시 원격 API에서 받아오고, 받아온 데이터는 `localStorage`에 하루 동안 캐시합니다.

## 데이터 방식

- 기본 391명: `alexislours/ACNHAPI`의 `villagers.json`
- 2.0/Sanrio 추가 22명: Nookipedia MediaWiki API의 각 주민 페이지 위키텍스트
- 이미지: 기본 주민은 `alexislours/ACNHAPI`, 추가 주민은 Nookipedia 파일 리다이렉트
- 섬 주민/위시리스트 목록: 기본은 `localStorage`, `sync-config.js`에 공유 저장소 URL을 넣으면 원격 동기화
- API 실패 시: 마지막 캐시를 사용하고, 캐시도 없으면 로컬 `villagers.json`, 그것도 실패하면 샘플 데이터로 동작합니다.

정상 로딩되면 총 413명을 사용할 수 있습니다. 화면에는 데이터 개수/캐시 문구를 표시하지 않습니다.


## 여러 기기 동기화

정적 HTML과 `localStorage`만으로는 A폰/B폰 데이터가 자동으로 같아질 수 없습니다. Supabase 프로젝트를 만들고 `sync-config.js`에 URL과 anon key를 넣으면 같은 데이터를 공유합니다.

Supabase SQL Editor에서 아래 테이블을 먼저 만드세요.

```sql
create table if not exists public.acnh_shared_state (
  id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone not null default now(),
  constraint app_state_pkey primary key (id)
);

alter table public.acnh_shared_state enable row level security;

create policy "Anyone can read acnh shared state"
  on public.acnh_shared_state for select
  using (true);

create policy "Anyone can upsert acnh shared state"
  on public.acnh_shared_state for insert
  with check (true);

create policy "Anyone can update acnh shared state"
  on public.acnh_shared_state for update
  using (true)
  with check (true);
```

그 다음 `sync-config.js`에 Supabase 설정을 넣으면 됩니다.

```js
window.ACNH_SYNC_CONFIG = {
  provider: "supabase",
  projectUrl: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  table: "acnh_shared_state",
  rowId: "main",
};
```

앱은 `acnh_shared_state` 테이블의 `id = main` 한 행의 `data` 컬럼에 섬 주민과 위시리스트를 저장합니다.
## 친구에게 공유하기

카카오톡으로 쉽게 공유하려면 GitHub Pages, Netlify, Vercel 같은 정적 호스팅에 올린 뒤 URL 하나를 보내는 것을 추천합니다.

## 무값 예측기

상단의 `무값 예측기` 버튼은 Turnip Prophet으로 연결됩니다.
