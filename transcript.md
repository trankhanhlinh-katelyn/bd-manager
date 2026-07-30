# Transcript — Quá trình khám phá, chạy thử và tài liệu hóa Agents/Skills của BD Tool

Tóm tắt lại toàn bộ quá trình trao đổi để hiểu, kiểm thử và tài liệu hóa hệ thống Claude Code agent/skill trong `bd-tool/.claude/`. Ghi lại theo từng giai đoạn: **prompt** người dùng đưa ra → **quyết định thiết kế/xử lý** → **cách triển khai**.

---

## Giai đoạn 1 — Khảo sát toàn bộ project

**Prompt:**
> "Hãy đọc toàn bộ project này, đặc biệt các file trong .claude/agents, .claude/skills, .claude/commands. Tóm tắt cho tôi: mỗi agent/skill làm nhiệm vụ gì, input/output là gì, và chúng liên kết với nhau ra sao."

**Quyết định xử lý:**
- Duyệt toàn bộ cây thư mục thay vì đoán cấu trúc — phát hiện thư mục gốc `Claude ai/` chỉ có `.claude/settings.local.json`, còn agent/skill thật nằm sâu trong `bd-tool/.claude/`.
- Xác nhận `bd-tool/.claude/commands/` tồn tại nhưng **trống** — không có custom slash command nào, toàn bộ routing dựa vào `description` trong frontmatter của agent/skill.

**Cách triển khai:**
- Đọc lần lượt: `agents/contract-agent.md`, `agents/reporting-agent.md`, `skills/bd-weekly-report/SKILL.md`, `skills/seo-contract/SKILL.md`, `skills/zalo-notify/SKILL.md`, và `README.md` gốc của app để có bối cảnh nghiệp vụ.
- Tổng hợp thành sơ đồ luồng: BD Manager (export JSON) → `reporting-agent` (dùng `bd-weekly-report` + `zalo-notify`) và `contract-agent` (dùng `seo-contract` + `zalo-notify`) — với `zalo-notify` là skill dùng chung giữa 2 agent.
- Kết luận: 2 agent không giẫm chân nhau nhờ mô tả "KHÔNG dùng agent này cho..." rõ ràng trong frontmatter; không có agent điều phối cấp cao hay slash command nào — người dùng phải diễn đạt tự nhiên để Claude Code tự chọn agent.

---

## Giai đoạn 2 — Chạy thử `bd-weekly-report`

**Prompt:**
> "Hãy chạy thử skill bd-weekly-report với dữ liệu mẫu trong thư mục reports/ (hoặc tự tạo dữ liệu mẫu nếu chưa có), và xuất ra 1 báo cáo hoàn chỉnh để tôi xem kết quả thực tế."

**Quyết định thiết kế/xử lý:**
- `reports/` chỉ có 1 file `.md` cũ (`bao-cao-bd-tuan-28-2026.md`), không có JSON input mẫu (thư mục này bị gitignore) → quyết định tự tạo dữ liệu giả lập đúng schema `{exportedAt, deals[], tasks[]}` mà `gen_report.py` yêu cầu, thay vì bịa báo cáo tay.
- Khi chạy script gặp lỗi thật: `TypeError: can't compare offset-naive and offset-aware datetimes` — quyết định **sửa tận gốc** trong `scripts/gen_report.py` thay vì né tránh bằng cách chỉnh dữ liệu mẫu, vì lỗi này sẽ xảy ra với **mọi** file export thật (do `Date.toISOString()` của JS luôn có hậu tố `Z`).

**Cách triển khai:**
- Đọc `scripts/gen_report.py` để nắm đúng schema và logic phân tích trước khi tạo dữ liệu giả.
- Tạo `reports/export-mau-2026-07-30.json`: 7 deal (đủ 6 stage MQL→FAIL) + 8 task (2 quá hạn, 3 sắp đến hạn, 3 hoàn thành trong tuần), mốc thời gian neo theo ngày hiện tại (30/07/2026).
- Sửa `parse_date()` trong `gen_report.py`: chuẩn hóa mọi datetime về dạng naive (`.replace(tzinfo=None)`) ngay sau khi parse, để khớp với `datetime.now()`.
- Chạy lại `python3 scripts/gen_report.py reports/export-mau-2026-07-30.json reports/bao-cao-bd-tuan-31-2026.md` → thành công, xuất báo cáo tuần 31/2026 đầy đủ (pipeline theo giai đoạn, doanh thu, task quá hạn/sắp đến hạn, lịch hẹn).
- Báo cáo lại cho người dùng kèm cảnh báo rõ về bug đã sửa.

---

## Giai đoạn 3 — Chạy thử `seo-contract`

**Prompt:**
> "Hãy chạy thử skill seo-contract với 1 hợp đồng mẫu trong thư mục contracts/, xuất kết quả ra file cụ thể."

**Quyết định thiết kế/xử lý:**
- `contracts/template-thong-tin-khach-hang.csv` có sẵn nhưng là **template rỗng** (chỉ có cột ví dụ, cột `Gia_tri` trống) → quyết định tạo 1 bộ CSV **đã điền đủ 41 trường** cho khách hàng giả định, không dùng file cũ để tránh nhầm với dữ liệu khách thật đã có trong repo.
- Máy chưa cài `python-docx`, và `pip install` trực tiếp bị chặn (`externally-managed-environment` trên macOS/Homebrew Python) → quyết định tạo **virtualenv tạm trong `/tmp`** thay vì dùng `--break-system-packages` (tránh phá vỡ Python hệ thống), và dọn sạch venv sau khi xong.
- Tải hợp đồng khung thật từ link Google Docs được chỉ định trong `SKILL.md` (đúng theo Bước 1 của skill) để đảm bảo văn bản pháp lý giữ nguyên, chỉ thay phần thông tin.

**Cách triển khai:**
- `curl` tải hợp đồng khung → đọc để nắm cấu trúc Điều I–X + Phụ lục 01, 02.
- Tạo `contracts/mau-thong-tin-khach-hang-bluemoon.csv` — khách hàng mẫu "CÔNG TY CỔ PHẦN THỜI TRANG BLUEMOON", số liệu tài chính được chọn sao cho nhất quán (VAT 8%, breakdown chi phí khớp tổng giá trị).
- Viết script `/tmp/gen_hd.py` dùng `python-docx`: A4, Times New Roman 13pt; tự viết hàm số→chữ tiếng Việt cho tiền VNĐ; tính tự động `gia_tri_chua_vat`, `tien_vat`, giá trị 3 đợt thanh toán; dựng đầy đủ Điều I–X, 2 bảng tài chính, Phụ lục 01 (danh sách từ khóa) và Phụ lục 02 (checklist onpage 30 hạng mục), khối chữ ký.
- Chạy bằng Python trong venv tạm → xuất `contracts/hop-dong-seo-bluemoon-fashion-2026-07-30.docx`.
- Verify file: mở lại bằng `python-docx`, đếm số đoạn văn (197) và số bảng (7) để xác nhận không lỗi cấu trúc.
- Dọn dẹp venv và script tạm trong `/tmp`.

---

## Giai đoạn 4 — Chạy thử `zalo-notify`

**Prompt:**
> "Hãy chạy thử skill zalo-notify để mô phỏng gửi thông báo (dùng dữ liệu giả nếu chưa có API key thật), in log ra để tôi thấy quy trình chạy."

**Quyết định thiết kế/xử lý:**
- Không có `config/webhook.json` thật (chỉ có `webhook.example.json`) → thay vì chỉ in ra nội dung tin nhắn giả, quyết định dựng **1 local mock HTTP server** đóng vai Zalo OA/Slack thật, để `curl POST` là request HTTP thật sự được gửi đi và nhận về — mô phỏng sát quy trình thật nhất có thể thay vì giả lập trên giấy.
- Sau khi test xong, quyết định **xóa `config/webhook.json` giả** (không giữ lại) để tránh nhầm lẫn với cấu hình webhook thật mà người dùng sẽ tự điền sau này.

**Cách triển khai:**
- Viết `/tmp/mock_webhook.py` (dùng `http.server` chuẩn của Python): nhận `POST`, log lại nội dung JSON nhận được, trả về `{"ok": true}` HTTP 200.
- Chạy mock server nền ở `127.0.0.1:8899`.
- Tạo `config/webhook.json` trỏ về mock server, đúng thực hiện Bước 0 của `SKILL.md`.
- Lần lượt mô phỏng và gửi cả 3 dạng tin nhắn theo đúng format trong skill:
  1. Tự do — thông báo tạo hợp đồng xong
  2. `deal:` — cập nhật deal "Sen Việt" chuyển sang CONTRACT (tái dùng dữ liệu deal mẫu từ Giai đoạn 2)
  3. `task:` — nhắc task quá hạn "Follow up hợp đồng Hòa Phát Mini" (tái dùng dữ liệu task mẫu từ Giai đoạn 2)
- In log ở cả 2 phía: phía gửi (`curl` + HTTP status) và phía nhận (log của mock server hiển thị đúng nội dung nhận được) để chứng minh round-trip hoạt động đúng.
- Dọn dẹp: kill mock server, xóa file script/log tạm, xóa `config/webhook.json` giả.

---

## Giai đoạn 5 — Viết lại README.md

**Prompt:**
> "Hãy viết lại README.md cho project này theo cấu trúc: 1) Bài toán/mục tiêu, 2) Cách setup & vận dụng Claude Code (agents, skills, commands), 3) Hướng dẫn chạy thử từng skill, 4) Kết quả đầu ra là gì. Viết ngắn gọn, rõ ràng, có thể dùng để nộp báo cáo."

**Quyết định thiết kế/xử lý:**
- Giữ lại phần giới thiệu app gốc (ngắn gọn) ở đầu, nhưng trọng tâm README chuyển sang mô tả **lớp tích hợp Claude Code** — vì đó là nội dung cần nộp báo cáo, không phải tính năng app.
- Đưa nguyên tắc thiết kế đã rút ra ở Giai đoạn 1 (agent = điều phối nghiệp vụ, skill = quy trình atomic dùng lại được, không cần custom command) thành nội dung chính thức của mục 2.
- Dùng chính các file output thật đã tạo ở Giai đoạn 2–4 làm ví dụ trong mục 3 và 4, thay vì mô tả lý thuyết — để README phản ánh đúng thực tế đã kiểm chứng.
- Đưa việc phát hiện & sửa bug `gen_report.py` vào mục 4 như một minh chứng giá trị gia tăng của việc chạy thử bằng dữ liệu mô phỏng.

**Cách triển khai:**
- Viết lại toàn bộ `bd-tool/README.md` theo 4 mục yêu cầu, kèm bảng tổng hợp input/output của 3 skill và 2 mục phụ ngắn (cách mở app, tech stack) để không mất thông tin nền tảng.

---

## Tổng kết các file được tạo/sửa trong quá trình này

| File | Loại thay đổi | Mục đích |
|---|---|---|
| `scripts/gen_report.py` | Sửa bug thật | Fix `TypeError` do so sánh datetime aware/naive — ảnh hưởng mọi lần chạy thật |
| `reports/export-mau-2026-07-30.json` | Tạo mới | Dữ liệu export mẫu để test `bd-weekly-report` |
| `reports/bao-cao-bd-tuan-31-2026.md` | Tạo mới | Output mẫu của `bd-weekly-report` |
| `contracts/mau-thong-tin-khach-hang-bluemoon.csv` | Tạo mới | Dữ liệu khách hàng mẫu (41 trường) để test `seo-contract` |
| `contracts/hop-dong-seo-bluemoon-fashion-2026-07-30.docx` | Tạo mới | Output mẫu của `seo-contract` |
| `config/webhook.json` | Tạo tạm rồi xóa | Mô phỏng cấu hình webhook để test `zalo-notify`, không giữ lại sau test |
| `README.md` | Viết lại toàn bộ | Tài liệu báo cáo tích hợp Claude Code theo cấu trúc 4 phần |
| `transcript.md` | Tạo mới (file này) | Ghi lại toàn bộ quá trình trao đổi để xây dựng và kiểm thử agent/skill |
