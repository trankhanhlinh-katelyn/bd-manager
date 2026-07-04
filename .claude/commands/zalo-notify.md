---
name: zalo-notify
description: Gửi thông báo deal hoặc task qua Zalo OA webhook. Kết nối trực tiếp với Zalo Official Account API để push tin nhắn cho team.
allowed-tools: Read, Write, Bash
user-invokable: true
---

Khi user gọi `/zalo-notify [nội-dung]`, thực hiện **đúng thứ tự** các bước dưới đây.

---

## Bước 0 — Kiểm tra cấu hình webhook

Đọc file `config/webhook.json` bằng Read tool.

### Nếu file chưa tồn tại hoặc `zalo_webhook_url` còn trống:

Tạo file `config/webhook.json` với nội dung:

```json
{
  "zalo_webhook_url": "",
  "slack_webhook_url": "",
  "default_platform": "zalo",
  "team_name": "SEONGON BD Team",
  "notification_prefix": "🔔 BD Manager"
}
```

Hướng dẫn user:
```
⚙️ Cần cấu hình webhook trước khi dùng:

Zalo OA Webhook:
  1. Vào Zalo for Business (business.zalo.me)
  2. Chọn Official Account → Webhook → Tạo Webhook URL
  3. Copy URL vào trường "zalo_webhook_url" trong file config/webhook.json

Slack Webhook:
  1. Vào Slack App → Incoming Webhooks → Add New Webhook
  2. Copy Webhook URL vào trường "slack_webhook_url"

Sau khi điền xong, gọi lại: /zalo-notify [nội dung]
```

Dừng lại và chờ user cấu hình.

---

## Bước 1 — Xác định nội dung cần gửi

User có thể cung cấp theo các dạng:

### Dạng 1: Thông báo tự do
```
/zalo-notify Khách Tân Á Đại Thành vừa ký hợp đồng 260M!
```

### Dạng 2: Thông báo deal (có từ khoá "deal:")
```
/zalo-notify deal: Tên deal | Giai đoạn | Giá trị | Người phụ trách
```

### Dạng 3: Thông báo task (có từ khoá "task:")
```
/zalo-notify task: Tên task | Hạn | Người phụ trách | Deal liên quan
```

Format tin nhắn tương ứng:

**Deal:**
```
🔔 BD Manager – Cập nhật Deal

🏢 Deal: {tên deal}
📍 Giai đoạn: {stage}
💰 Giá trị: {giá trị} VNĐ
👤 Phụ trách: {người phụ trách}
🕐 {ngày giờ hiện tại}
```

**Task:**
```
🔔 BD Manager – Nhắc việc

📌 Task: {tên task}
📅 Hạn: {due date}
👤 Phụ trách: {người phụ trách}
🏢 Deal: {deal liên quan}
🕐 {ngày giờ hiện tại}
```

**Tự do:**
```
🔔 BD Manager

{nội dung}
🕐 {ngày giờ hiện tại}
```

---

## Bước 2 — Gửi thông báo qua webhook

Đọc `config/webhook.json` để lấy URL và platform mặc định.

Dùng Bash để gửi POST request:

**Zalo OA Webhook:**
```bash
curl -s -X POST "{zalo_webhook_url}" \
  -H "Content-Type: application/json" \
  -d '{"text": "{nội dung đã format}"}'
```

**Slack Webhook:**
```bash
curl -s -X POST "{slack_webhook_url}" \
  -H "Content-Type: application/json" \
  -d '{"text": "{nội dung đã format}"}'
```

Kiểm tra response:
- HTTP 200 / `{"ok":true}` → thành công
- Lỗi → thông báo lỗi cho user và gợi ý kiểm tra lại webhook URL

---

## Bước 3 — Báo cáo kết quả

```
✅ Đã gửi thông báo thành công!

📱 Platform : {Zalo OA / Slack}
📝 Nội dung : {preview 100 ký tự đầu}
🕐 Gửi lúc  : {ngày giờ}

💡 Mẹo: Dùng /zalo-notify deal: ... hoặc /zalo-notify task: ... để gửi theo template chuẩn.
```

---

## Lưu ý quan trọng

- **Không hardcode** webhook URL trong skill — luôn đọc từ `config/webhook.json`
- File `config/webhook.json` đã được thêm vào `.gitignore` để bảo vệ URL bí mật
- Hỗ trợ cả Zalo OA webhook và Slack webhook — dùng trường `default_platform` để chọn
- File bổ trợ: `config/webhook.json` (cấu hình), `config/webhook.example.json` (mẫu)
