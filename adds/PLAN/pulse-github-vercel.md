# PLAN — Publish PULSE to GitHub and Vercel

Ngày: 2026-10-25. Workspace: D:/testGPTPLUS.
Builder: Herdr agent `builder`, pane `w3:p2`, Gemini 3.8 Flash Medium.

## Mục tiêu và ủy quyền

Tạo repository **PUBLIC** `West2light/pulse-live-market`, push source đã nghiệm thu, kết nối đúng GitHub repository với Vercel, deploy production và xác minh URL hoạt động. Người dùng đã yêu cầu thực hiện toàn bộ quy trình và chọn public. Không cần xin duyệt lại các bước trong phạm vi này.

Nếu tên repository đã tồn tại, kiểm tra nội dung/owner trước; không ghi đè hoặc force-push repository không thuộc task. Nếu xung đột thực sự, báo để chọn tên khác.

## Hiện trạng đã xác minh

- `gh auth status`: tài khoản active `West2light`.
- `vercel whoami`: `west2light`; CLI 65.2.0.
- Workspace chưa có Git repository tại lần kiểm tra gần nhất; kiểm tra lại trước khi init.
- PULSE: typecheck, lint, 24/24 tests và production build đều pass.
- Chrome: Kraken thật lên LIVE, bốn cặp giá; 320/768/1440px không tràn ngang; reduced motion và keyboard focus đã kiểm tra.
- axe: 0 violations sau sửa contrast ở LIVE và ERROR trong các viewport đã chạy.
- Không cần API key, backend, database hay biến môi trường cho Kraken public socket.

## M1 — Chuẩn bị nội dung public

1. Kiểm tra Git/cwd hiện tại. Giữ nguyên source và file cá nhân. Không đọc/in credential hoặc token.
2. Tạo `.gitignore` và `.vercelignore` trước khi stage/upload; loại trừ:
   - `node_modules/`, `dist/`, `.vercel/`, `.codex/`, `.agents/`.
   - `.env*` (chỉ cho phép `.env.example` nếu thực sự có), `*.local`, `*.log`.
   - `adds/REVIEW/`, `skills-lock.json` (artifact cục bộ, không thuộc ứng dụng).
   - Git metadata khỏi payload Vercel nếu cần.
3. Chỉ stage allowlist: source, tests, package + lockfile, index.html, TS/Vite/ESLint configs, README, hai ignore files, config Vercel nếu cần và `adds/PLAN/`.
4. Kiểm tra staged paths và dò credential một cách không in giá trị nhạy cảm. Không dùng `git add .` trước khi ignore được kiểm tra.
5. Init `main` nếu chưa có Git. Dùng identity Git đã cấu hình; nếu thiếu, lấy identity phù hợp từ tài khoản GitHub và đặt repo-local; không sửa global identity.
6. Tạo commit tiếng Nhật theo Conventional Commit, ví dụ `feat: PULSEのリアルタイム市場ページを公開`.
7. Xác minh không có file bị cấm trong commit và `git diff --cached --check` không lỗi.

## M2 — GitHub public repository

Kiểm tra repo đích chưa tồn tại rồi thực hiện:

```powershell
gh repo create West2light/pulse-live-market --public --source . --remote origin --push --description "PULSE real-time crypto landing page with Kraken WebSocket"
gh repo view West2light/pulse-live-market --json nameWithOwner,isPrivate,defaultBranchRef,url
git ls-remote --heads origin main
```

Xác nhận `isPrivate=false`, default branch `main`, SHA local trùng remote. Không force-push, không thêm license tùy ý.

## M3 — Vercel project, Git integration và production

1. Kiểm tra `vercel whoami`, xem account/team và project hiện có. Không chọn project của người khác hoặc project không liên quan.
2. Dùng CLI help hiện cài làm nguồn cú pháp: `vercel link --help`, `vercel git --help`, `vercel deploy --help`.
3. Tạo/link project tên `pulse-live-market` dưới scope của account đã xác minh. Dùng Vite preset, project root `.`, build `npm run build`, output `dist`, install `npm ci`. Có thể commit `vercel.json` tối thiểu nếu cần; không cần SPA rewrite cho route duy nhất.
4. Kết nối GitHub remote thực sự bằng `vercel git connect https://github.com/West2light/pulse-live-market` hoặc API/plugin tương đương. Xác minh project Git settings trỏ đúng repo, production branch `main`. Link folder/project và deploy CLI riêng lẻ chưa đủ để tuyên bố Git integration đã xong.
5. `.vercel/` luôn giữ local và ignored. Không push auth/project secrets; không tạo token mới.
6. Nếu thêm config deployment, commit + push trước khi deploy để production khớp SHA trên GitHub.
7. Chạy `vercel deploy --dry --json` để kiểm tra payload không chứa file local/credential. Không in toàn bộ file nhạy cảm.
8. Chạy production:
   ```powershell
   vercel deploy --prod --yes --verify
   ```
   Kiểm tra project đã link trước khi dùng `--yes`. Nếu phiên bản CLI yêu cầu `--create-if-missing`, chỉ dùng với tên/scope project mới đã kiểm tra. Không dùng temporary deploy.
9. Xác minh bằng `vercel inspect <url>`, trạng thái READY, production alias và Git link đúng. Kiểm tra logs lỗi với cú pháp `vercel logs --help` thực tế.
10. Không tự mua domain, nâng plan, thêm dịch vụ trả phí, hoặc tắt deployment protection. Dùng domain .vercel.app mặc định.

## M4 — Xác minh và bàn giao

- Chạy typecheck/lint/test/build sau mọi thay đổi source/config cần kiểm tra.
- HTTP production URL trả 200; browser hiển thị PULSE và 4 cards, nhận giá thật qua Kraken.
- Kiểm tra console/page errors và reconnect cơ bản. Nếu bị chặn theo môi trường, ghi rõ chứ không báo pass giả.
- Kiểm tra remote GitHub là public, commit sync; Vercel project liên kết đúng repo.
- Ghi `adds/PLAN/pulse-deployment-result.md`: repo URL, visibility, commit SHA, Vercel project/scope, deployment ID/URL, production alias, READY state, checks thực tế và giới hạn.
- Nếu thêm báo cáo sau deploy tạo commit mới, không để production lệch main: push và chờ Git integration build commit mới rồi xác minh, hoặc để báo cáo local untracked và nói rõ.

## Trường hợp cần thao tác từ người dùng

- GitHub session thiếu/hết hạn: nhắc chạy `gh auth login`, hoàn thành browser/device flow.
- Vercel session thiếu/hết hạn: nhắc chạy `vercel login`.
- GitHub integration chưa cấp quyền repository: cung cấp đúng URL dashboard/install authorization do Vercel trả về, hướng dẫn chọn `West2light/pulse-live-market`, rồi dừng riêng bước phụ thuộc đến khi người dùng hoàn thành.
- Approval/question trong Herdr: không tự trả lời; báo boss nội dung để nhắc người dùng theo skill Herdr.
- Không yêu cầu người dùng dán token vào chat. Không đổi scope/team tùy tiện.

## Handoff

Builder thực hiện M1–M4 bằng CLI gh và Vercel trong workspace này, giữ model hiện tại. Báo kết quả và blocker cụ thể về boss; không gửi prompt trở lại boss trong lúc boss đang làm việc (tránh tạo lượt nhận lồng nhau). Không dừng ở việc đề xuất câu lệnh nếu CLI đã sẵn sàng và được ủy quyền.
