# JETTY SPACE v0.7 — Render 배포 준비본

기존 ATOM SPACE와 **별도의 GitHub 저장소 / 별도의 Render Web Service**에 배포하기 위한 파일입니다.

## 1. GitHub

1. GitHub에서 새 저장소를 만듭니다. 추천 저장소명은 `jetty-space-science`입니다.
2. Private를 선택해도 Render GitHub 연동 후 배포 가능합니다.
3. `Add file` → `Upload files`에서 **압축을 해제한 이 폴더 안에 있는 파일과 `public` 폴더**를 추가합니다. ZIP 자체를 올리지 마세요.
4. 저장소 맨 위에 `package.json`, `server.js`, `render.yaml`, `public/`이 표시되는지 확인합니다. 파일이 `JETTY_SPACE_v0.7_Render_배포준비/`라는 하위 폴더 안에 들어가면 업로드를 수정합니다.
5. `Commit changes`를 완료합니다.

## 2. Render

1. Dashboard → `New` → **Web Service** 선택 (Static Site 아님: 실시간 WebSocket 서버 필요).
2. GitHub 저장소 `jetty-space-science` 연결.
3. `Name`: `jetty-space-science`(사용 중이면 다른 고유한 이름), `Language`: Node, `Branch`: main.
4. `Root Directory`: 빈칸, `Build Command`: `npm install`, `Start Command`: `npm start`.
5. `Instance Type`: Free. `Region`: Singapore 추천 (선택 가능할 때).
6. `Environment Variables`: 추가 입력 없음. `NODE_VERSION`은 `.node-version`에서 설정됩니다. `PORT`는 Render가 제공합니다.
7. `Deploy Web Service` 클릭하고 `Your service is live`와 실제 서비스 URL을 확인합니다.

`render.yaml`은 Render Blueprint용 참고 설정입니다. 일반 Web Service에서 수동으로 생성하는 경우 위 설정을 사용하세요.

## 3. 배포 후 점검

- 홈페이지 접속 및 **GLB 로딩 완료 → 전시관 입장**
- `/health` → `{"ok":true,...}` 응답 (브라우저에서 접속)
- 캐릭터 Idle/Walk/Wave, 카메라, 충돌 정상 동작
- 다른 브라우저/기기 두 개에서 동일 주소 접속: 아바타와 채팅 동기화
- 연결에 실패하면 F12 → Console 첫 빨간 오류, Render Dashboard → Logs 확인

## 주의

- 이번 것은 **공개 시험용 버전**입니다. 익명 닉네임/채팅에는 계정 인증, 영구 보관, 교사용 신고/관리 기능이 아직 없습니다. 학생들에게 대규모로 공유하기 전에 별도 검토가 필요합니다.
- Render Free는 장기간 미사용 시 절전으로 접속이 지연됩니다. 두 Render 서버를 같이 운영하면 무료 사용량은 **워크스페이스에서 공유**합니다.
- 기존 ATOM SPACE 배포는 건드리지 않습니다.
