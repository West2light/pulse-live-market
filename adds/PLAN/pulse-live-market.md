# PLAN — PULSE live market landing page

## 1. Mục tiêu

Xây dựng landing page đơn giản, hiện đại cho **PULSE**, một bảng điều khiển theo dõi thị trường crypto theo thời gian thực. Trang phải truyền đạt ngay ba ý: dữ liệu đang chạy live, giao diện dễ đọc, và người dùng có thể bắt đầu theo dõi trong vài giây.

Đầu ra là web app chạy được trong workspace hiện tại, responsive từ mobile đến desktop, có motion tiết chế và tích hợp dữ liệu thật qua WebSocket công khai của Kraken.

## 2. Phạm vi sản phẩm

- Một route chính `/` duy nhất.
- Header: wordmark PULSE, trạng thái kết nối live, navigation neo tới Overview / How it works / CTA.
- Hero: eyebrow `REAL-TIME MARKET SIGNALS`, headline `See the market move.`, mô tả giá trị, CTA `Open live board`, secondary link `How it works`.
- Live market board: cặp BTC/USD, ETH/USD, SOL/USD và XRP/USD; mỗi thẻ hiển thị giá, phần trăm thay đổi, trạng thái tăng/giảm, sparkline/mini chart và timestamp cập nhật.
- Một khu vực signal giải thích dữ liệu đến trực tiếp từ exchange và tự reconnect khi mạng gián đoạn.
- Footer CTA ngắn với anchor tới live board và link thật tới tài liệu Kraken. Không tạo link giả hoặc control không có chức năng.

## 3. Tích hợp realtime

Dùng Kraken Spot WebSocket v2 tại `wss://ws.kraken.com/v2`.

Subscription message:

```json
{
  "method": "subscribe",
  "params": {
    "channel": "ticker",
    "symbol": ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"],
    "event_trigger": "trades",
    "snapshot": true
  }
}
```

Xử lý cả `snapshot` và `update`, duyệt mọi item trong `data` của message `channel === "ticker"`. Đọc `last`, `change_pct`, `symbol`; kiểm tra giá trị hữu hạn và chỉ nhận symbol đã đăng ký. `change_pct` là thay đổi 24 giờ từ exchange, không phải thay đổi trong phiên trang.

Timestamp hiển thị là thời điểm client nhận ticker (`Date.now()`), ghi rõ `Cập nhật lúc` / `Updated at`; không giả định ticker luôn có timestamp từ server. Sparkline giữ tối đa 24 điểm giá thật nhận trong phiên; ghi rõ `Session trend`, hiển thị trạng thái chờ khi chưa đủ 2 điểm. Không dựng lịch sử hoặc quảng cáo đây là biểu đồ 24 giờ.

Trạng thái kết nối:

- `CONNECTING`: đang mở socket hoặc chờ snapshot đầu tiên.
- `LIVE`: nhận ticker hợp lệ sau khi subscription thành công; chỉ có socket mở chưa đủ.
- `STALE`: không nhận bất kỳ frame nào trong 20 giây (heartbeat cũng tính là hoạt động); ticker ít giao dịch không đồng nghĩa socket chết. Đóng socket cũ và reconnect.
- `RECONNECTING`: socket lỗi/đóng, exponential backoff 1/2/4/8/16/30 giây với jitter nhỏ, một timer và một socket hoạt động tại một thời điểm. Reset backoff sau ticker hợp lệ.
- `ERROR`: subscription bị từ chối; không báo LIVE, có nút thử lại.

Hiển thị skeleton/`—` lúc chưa có dữ liệu. Khi mất kết nối giữ giá thật cuối cùng kèm nhãn stale và timestamp. Không dùng giá ngẫu nhiên hoặc demo trá hình. Parse lỗi/malformed JSON được bỏ qua an toàn; xử lý subscription acknowledgement, heartbeat và control message riêng.

Cleanup socket, stale watchdog và retry timer khi unmount; guard callback socket cũ để React StrictMode không tạo kết nối trùng. Không yêu cầu API key hoặc backend. Nếu API bị chặn trong môi trường chạy, ghi rõ giới hạn và vẫn kiểm tra state machine bằng WebSocket mock.

Tài liệu đã kiểm tra ngày 2026-10-25: https://docs.kraken.com/api/docs/websocket-v2/ticker (URL cũ có thể redirect). Builder kiểm tra endpoint/schema trước khi triển khai.

## 4. Hướng thiết kế

- Visual direction: editorial fintech, nền gần đen xanh `#071014`, panel xanh than, chữ trắng ngà, accent acid-lime `#D7FF64` và cyan `#6DE7F2`.
- Typography: sans display hình học cho headline và sans dễ đọc cho body; nếu không cài font thì dùng `Inter, ui-sans-serif, system-ui`.
- Bố cục nhiều khoảng thở, grid rõ, border mảnh, radius vừa phải; tránh gradient tím, glassmorphism nặng và stock illustration.
- Hero có visual `signal field`: các đường/grid và node chuyển động nhẹ bằng CSS/SVG, opacity thấp, không dùng video nặng.
- Tạo hierarchy rõ: headline lớn, số giá nổi bật, label uppercase nhỏ, màu xanh/lime chỉ dành cho live/positive/CTA.

## 5. Motion specification

- Page load: hero eyebrow, headline, supporting text, CTA và market board lần lượt fade + translateY 16px, tổng thời gian dưới 700ms.
- Signal field: chuyển động chậm, lặp vô hạn, opacity thấp.
- Live cards: khi giá đổi, animate indicator trong 250–350ms; giữ số mới chính xác, dùng tabular numerals và không làm layout nhảy. Coalesce render tối đa khoảng 4 lần/giây khi feed dày.
- Hover/focus: card nâng nhẹ 2px và border accent; CTA có translateY 1px khi press.
- Tôn trọng `prefers-reduced-motion: reduce`: tắt loop và chỉ giữ transition tức thời.
- Không dùng animation gây chóng mặt, không animate toàn bộ background liên tục.

## 6. Kỹ thuật đề xuất

- Nếu workspace chưa có app, scaffold app nhỏ bằng Vite + React + TypeScript (hoặc framework đã có nếu builder phát hiện được).
- CSS thuần hoặc CSS modules; dependency nhẹ. Có thể dùng `lucide-react` cho icon nhưng ưu tiên inline SVG/CSS.
- Component gợi ý: `Header`, `Hero`, `LiveBoard`, `MarketCard`, `SignalField`, `HowItWorks`, `FooterCTA`.
- Dữ liệu và socket logic nằm trong hook `useKrakenTicker`; cleanup socket và timer đầy đủ.
- Accessibility: semantic landmarks, heading order, visible focus, button/link thật, màu có contrast, `aria-live` cho connection status và giá cập nhật không spam screen reader.
- Responsive: mobile 1 cột; tablet 2 cột; desktop board 4 cột. Hero visual co giãn, không tràn ngang.
- Nội dung giao diện tiếng Anh nhất quán, document `lang="en"`. Có title, description, favicon SVG và README hướng dẫn chạy.
- Giữ nguyên `.codex`, `.agents`, `skills-lock.json` và PLAN. Không đọc/in cấu hình chứa credential. Không commit/push/deploy.

## 7. Acceptance criteria

- `npm install` và `npm run build` chạy thành công.
- Mở trang thấy hero và market cards ngay cả khi WebSocket lỗi.
- Khi có kết nối Kraken: badge chuyển `LIVE`, giá và change cập nhật theo message thật; timestamp hiển thị.
- Khi ngắt mạng/socket: badge chuyển `RECONNECTING`, có reconnect; không crash và không hiển thị LIVE giả.
- Motion chạy mượt trên desktop/mobile; reduced-motion được tôn trọng.
- Keyboard đi qua toàn bộ control; focus visible.
- Không có horizontal overflow ở viewport 320px.
- Kiểm tra lint/typecheck nếu scripts có sẵn; sửa lỗi trước khi bàn giao.
- Có test tập trung cho parser/socket lifecycle: snapshot/update, malformed/control messages, reconnect không trùng, stale watchdog, cleanup và subscription error. Dùng Vitest với fake timers/WebSocket mock; không viết test chỉ để so khớp markup.
- Kiểm tra browser nếu có công cụ: 320/768/1440px, keyboard focus, reduced motion, live ticker và offline/reconnect. Chụp screenshot nếu khả thi; báo rõ mục nào chưa chạy thay vì tuyên bố đã pass.

## 8. Milestone và bàn giao

1. **M1 — Foundation:** kiểm tra workspace, scaffold Vite/React/TS, thiết lập token màu/type/layout và nội dung landing page.
2. **M2 — Realtime:** triển khai hook, parser, trạng thái kết nối, board và session sparklines; thêm test cho logic bất đồng bộ.
3. **M3 — Motion & responsive:** hoàn thiện signal field, reveal, micro interaction, mobile và reduced motion.
4. **M4 — Verification:** chạy build/typecheck/test/lint, browser smoke nếu khả dụng; sửa lỗi, cập nhật README và báo cáo thực tế.

Tất cả milestone được giao thực hiện trong lượt này. Không cần dừng xin duyệt giữa milestone. Bàn giao gồm source code, lockfile, README và kết quả kiểm tra; không mở rộng scope thành sàn giao dịch.

## 9. Handoff cho builder

Đọc toàn bộ file này trước khi code. Tự kiểm tra workspace hiện tại, quyết định scaffold tối thiểu phù hợp, sau đó triển khai đầy đủ trong workspace. Không chỉ trả lời bằng code snippet: tạo/sửa file thật, chạy build và báo cáo các file đã tạo, lệnh kiểm tra, cùng các giới hạn còn lại. Giữ scope ở landing page PULSE và không thêm backend/auth/database.
