# BD Manager — Tích hợp Claude Code cho quy trình BD của SEONGON

Mini tool quản lý pipeline deal & task cho đội Business Development (Kanban, task/subtask, nhắc việc, dashboard) — chạy trực tiếp trên trình duyệt bằng `index.html`, không cần server, dữ liệu lưu `localStorage`.

Tài liệu này tập trung vào phần **tích hợp Claude Code** (agent + skill) được xây dựng thêm để tự động hóa các nghiệp vụ xung quanh BD Manager.

---

## 1. Bài toán / Mục tiêu

BD Manager giải quyết việc quản lý pipeline, nhưng 3 việc sau vẫn phải làm tay, tốn thời gian và dễ sai sót:

| Việc thủ công | Vấn đề |
|---|---|
| Soạn hợp đồng dịch vụ SEO cho khách mới | 41 trường thông tin, tính VAT/3 đợt thanh toán bằng tay → dễ sai số liệu, mất thời gian soạn thảo |
| Tổng hợp báo cáo BD tuần | Phải tự đếm deal theo giai đoạn, lọc task quá hạn/sắp đến hạn từ dữ liệu export |
| Thông báo cập nhật cho team | Copy tay nội dung deal/task để gửi Zalo/Slack, không đồng nhất định dạng |

**Mục tiêu:** dùng Claude Code (agent điều phối + skill atomic) để tự động hóa 3 luồng trên, cho ra output chuẩn hóa, tái lập được, và dễ mở rộng thêm nghiệp vụ mới sau này.

---

## 2. Cách setup và vận dụng Claude Code

Cấu trúc `.claude/` đặt trong `bd-tool/`:

```
bd-tool/.claude/
├── agents/
│   ├── contract-agent.md    # điều phối luồng hợp đồng
│   └── reporting-agent.md   # điều phối luồng báo cáo + thông báo
├── skills/
│   ├── seo-contract/SKILL.md      # sinh hợp đồng .docx
│   ├── bd-weekly-report/SKILL.md  # sinh báo cáo tuần .md
│   └── zalo-notify/SKILL.md       # gửi thông báo Zalo OA/Slack
└── commands/                 # để trống — chưa cần slash command riêng
```

**Nguyên tắc thiết kế:**

- **Agent = người điều phối nghiệp vụ.** Mỗi agent có `description` (frontmatter) mô tả rõ "dùng khi nào / không dùng khi nào" để Claude Code tự chọn đúng agent theo câu lệnh tự nhiên của người dùng, không cần gõ lệnh cố định.
  - `contract-agent`: nhận yêu cầu liên quan hợp đồng → gọi `seo-contract`, sau đó hỏi có muốn `zalo-notify` báo team không.
  - `reporting-agent`: nhận yêu cầu báo cáo/thông báo tiến độ → gọi `bd-weekly-report`, sau đó hỏi có muốn `zalo-notify` không. Chỉ đọc dữ liệu, không sửa file export.
- **Skill = quy trình kỹ thuật atomic**, có input/output rõ ràng, độc lập, dùng chung được giữa nhiều agent — ví dụ `zalo-notify` được cả 2 agent gọi lại thay vì viết trùng logic gửi webhook.
- **Không dùng custom command**: mô tả trong frontmatter của agent/skill đã đủ để Claude Code tự route đúng việc, giữ cho người dùng chỉ cần nói tự nhiên ("tạo hợp đồng cho khách X", "báo cáo tuần này")
- **Dữ liệu nhạy cảm gitignore**: `config/webhook.json` (webhook thật) và `reports/` (báo cáo có thể chứa số liệu kinh doanh) không commit lên repo.

---

## 3. Hướng dẫn chạy thử từng skill

### `seo-contract` — Tạo hợp đồng SEO

1. Cung cấp CSV 41 trường thông tin khách hàng, hoặc yêu cầu tạo template nếu chưa có (`contracts/template-thong-tin-khach-hang.csv`).
2. Gõ: *"Tạo hợp đồng SEO cho khách hàng [tên], theo file CSV [đường dẫn]"*
3. Claude Code (qua `contract-agent`) đọc hợp đồng khung, parse CSV, tự tính VAT & 3 đợt thanh toán, xuất `.docx`.

**Lưu ý môi trường:** skill dùng thư viện `python-docx`. Trên máy có Python quản lý qua Homebrew (`externally-managed-environment`), cần cài trong virtualenv riêng thay vì `pip install` thẳng vào hệ thống.

### `bd-weekly-report` — Báo cáo BD tuần

1. Mở `index.html` → nút **"Xuất dữ liệu"** → tải file `.json` (`{exportedAt, deals[], tasks[]}`).
2. Gõ: *"Tạo báo cáo BD tuần từ file [đường dẫn export.json]"*
3. Claude Code (qua `reporting-agent`) chạy `scripts/gen_report.py`, phân tích pipeline theo giai đoạn, task quá hạn/sắp đến hạn, xuất `.md` vào `reports/`.

### `zalo-notify` — Gửi thông báo team

1. Điền webhook thật vào `config/webhook.json` (copy từ `config/webhook.example.json`).
2. Gõ nội dung tự do, hoặc theo cú pháp `deal: ...` / `task: ...` để dùng format có cấu trúc.
3. Skill format tin theo đúng dạng (tự do / deal / task) và `curl POST` tới webhook, báo lại HTTP status.

---

## 4. Kết quả đầu ra

Đã chạy thử cả 3 skill với dữ liệu mẫu tự tạo (vì chưa có dữ liệu export thật / webhook thật) để xác nhận toàn bộ pipeline hoạt động đúng:

| Skill | Input thử nghiệm | Output |
|---|---|---|
| `bd-weekly-report` | JSON mẫu 7 deal + 8 task (`reports/export-mau-2026-07-30.json`) | `reports/bao-cao-bd-tuan-31-2026.md` — bảng pipeline theo stage, doanh thu dự kiến/đã chốt, task quá hạn/sắp đến hạn, lịch hẹn 7 ngày |
| `seo-contract` | CSV mẫu 41 trường đã điền (`contracts/mau-thong-tin-khach-hang-bluemoon.csv`) | `contracts/hop-dong-seo-bluemoon-fashion-2026-07-30.docx` — hợp đồng đầy đủ Điều I–X + Phụ lục 01–02, VAT & 3 đợt thanh toán tính tự động |
| `zalo-notify` | 3 tin nhắn mẫu (tự do / `deal:` / `task:`) gửi tới mock webhook local | Cả 3 request → HTTP 200, nội dung nhận đúng 100% với nội dung gửi |

**Giá trị phát sinh ngoài mục tiêu ban đầu:** trong lúc test `bd-weekly-report`, phát hiện và sửa 1 bug thật trong `scripts/gen_report.py` — hàm `parse_date()` trả về datetime có timezone trong khi `datetime.now()` không có, khiến script crash `TypeError` với **mọi** file export thật (do `Date.toISOString()` của JS luôn có hậu tố `Z`). Đây là minh chứng cho việc chạy thử bằng dữ liệu mô phỏng không chỉ xác nhận luồng hoạt động mà còn phát hiện lỗi tiềm ẩn trước khi dùng dữ liệu thật.

---

## Cách mở app BD Manager

```bash
git clone <repo-url>
cd bd-tool
open index.html   # macOS — không cần server, không cần internet
```

## Tech stack

- App: Vanilla HTML/CSS/JS, `localStorage`, Browser Notification API
- Tự động hóa: Claude Code (agent + skill), Python (`python-docx`, script báo cáo)
