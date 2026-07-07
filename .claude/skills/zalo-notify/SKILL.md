---
name: zalo-notify
description: |
  Dùng skill này khi user muốn gửi thông báo cho team qua Zalo OA hoặc Slack.
  Kích hoạt khi user đề cập đến: gửi thông báo, notify team, báo Zalo, push Slack,
  thông báo deal mới, nhắc task, hoặc bất kỳ yêu cầu nào liên quan đến gửi tin nhắn
  tự động đến kênh nội bộ SEONGON BD Team. Hỗ trợ 3 dạng: thông báo tự do, thông báo
  deal (kèm stage và giá trị), thông báo task (kèm hạn và người phụ trách). Đọc cấu hình
  webhook từ config/webhook.json; nếu chưa có thì hướng dẫn user thiết lập.
tools: [Read, Write, Bash]
---

## Mô tả

Skill gửi thông báo deal/task đến team qua Zalo OA webhook hoặc Slack webhook. Cấu hình lưu tại `config/webhook.json` (không commit lên git).

---

## Bước 0 — Kiểm tra cấu hình webhook

Đọc `config/webhook.json`.

Nếu file chưa tồn tại hoặc URL còn trống, tạo file:

```json
{
  "zalo_webhook_url": "",
  "slack_webhook_url": "",
  "default_platform": "zalo",
  "team_name": "SEONGON BD Team",
  "notification_prefix": "🔔 BD Manager"
}
```

Sau đó hướng dẫn:

```
⚙️ Cần cấu hình webhook trước khi dùng:

Zalo OA Webhook:
  1. Vào business.zalo.me → Official Account → Webhook → Tạo URL
  2. Copy URL vào "zalo_webhook_url" trong config/webhook.json

Slack Webhook:
  1. Slack App → Incoming Webhooks → Add New Webhook to Workspace
  2. Copy URL vào "slack_webhook_url"

Sau khi điền xong, thử lại yêu cầu gửi thông báo.
```

Dừng lại, chờ user cấu hình.

---

## Bước 1 — Xác định nội dung và format

### Dạng 1 — Thông báo tự do
Khi user chỉ cung cấp nội dung text đơn giản:
```
🔔 BD Manager

{nội dung}
🕐 {DD/MM/YYYY HH:mm}
```

### Dạng 2 — Thông báo deal (nhận diện từ khoá "deal:")
```
🔔 BD Manager – Cập nhật Deal

🏢 Deal: {tên deal}
📍 Giai đoạn: {stage}
💰 Giá trị: {giá trị} VNĐ
👤 Phụ trách: {người phụ trách}
🕐 {DD/MM/YYYY HH:mm}
```

### Dạng 3 — Thông báo task (nhận diện từ khoá "task:")
```
🔔 BD Manager – Nhắc việc

📌 Task: {tên task}
📅 Hạn: {due date}
👤 Phụ trách: {người phụ trách}
🏢 Deal: {deal liên quan}
🕐 {DD/MM/YYYY HH:mm}
```

---

## Bước 2 — Gửi qua webhook

Đọc URL từ `config/webhook.json`, dùng `default_platform` để chọn kênh.

```bash
curl -s -X POST "{webhook_url}" \
  -H "Content-Type: application/json" \
  -d '{"text": "{nội dung đã format}"}'
```

- HTTP 200 / `{"ok":true}` → thành công
- Lỗi → thông báo lỗi và gợi ý kiểm tra lại URL

---

## Bước 3 — Xác nhận kết quả

```
✅ Đã gửi thông báo!

📱 Platform : {Zalo OA / Slack}
📝 Nội dung : {preview 100 ký tự}
🕐 Gửi lúc  : {DD/MM/YYYY HH:mm}
```

---

## Lưu ý

- Không hardcode webhook URL — luôn đọc từ `config/webhook.json`
- `config/webhook.json` đã gitignore, không bị commit lên GitHub
- Xem mẫu cấu hình tại `config/webhook.example.json`
