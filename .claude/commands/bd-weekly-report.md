---
name: bd-weekly-report
description: Tạo báo cáo BD tuần từ file export JSON của BD Manager. Tổng hợp deal theo giai đoạn, task hoàn thành, pipeline doanh thu, lịch hẹn sắp tới.
allowed-tools: Read, Write, Bash
user-invokable: true
---

Khi user gọi `/bd-weekly-report [path-to-export.json]`, thực hiện **đúng thứ tự** các bước dưới đây.

---

## Bước 0 — Kiểm tra file input

### Nếu user cung cấp đường dẫn file JSON:
- Dùng Read tool đọc file
- File là kết quả export từ BD Manager (format: `{ exportedAt, deals[], tasks[] }`)

### Nếu không có file:
Hướng dẫn user export:
```
📋 Để tạo báo cáo, cần export dữ liệu từ BD Manager trước:
   1. Mở file index.html trong trình duyệt
   2. Click nút "Xuất dữ liệu" ở sidebar dưới cùng
   3. Lưu file .json về máy
   4. Gọi lại: /bd-weekly-report [đường-dẫn-file.json]
```
Dừng lại và chờ user cung cấp file.

---

## Bước 1 — Parse và phân tích dữ liệu

Đọc và phân tích JSON:

**Deals:**
- Đếm theo từng stage: MQL / SAL / SQL / CONTRACT / CUS / FAIL
- Tính tổng giá trị pipeline (deals chưa đóng, nhân xác suất)
- Tính tổng doanh thu đã chốt (stage = CUS)
- Liệt kê deals có appointment trong 7 ngày tới

**Tasks:**
- Đếm task theo trạng thái: todo / in_progress / done
- Liệt kê task quá hạn (dueDate < hôm nay, status ≠ done)
- Liệt kê task hoàn thành trong 7 ngày qua
- Liệt kê task đến hạn trong 7 ngày tới

**Thống kê tuần:**
- Xác định "tuần báo cáo" = tuần chứa ngày export (hoặc tuần hiện tại)

---

## Bước 2 — Tạo file báo cáo

Chạy script Python `scripts/gen_report.py` bằng Bash với tham số là đường dẫn JSON:

```bash
python3 scripts/gen_report.py [path-to-json] [output-path]
```

Script sẽ tạo file markdown báo cáo với cấu trúc:

```markdown
# BÁO CÁO BD TUẦN [W] — [Từ ngày] đến [Đến ngày]

## 📊 Tổng quan Pipeline
| Giai đoạn | Số deal | Giá trị (VNĐ) |
|...|...|...|

## 💰 Doanh thu
- Pipeline dự kiến (theo xác suất): X VNĐ
- Đã chốt (CUS): X VNĐ

## ✅ Task tuần này
- Hoàn thành: X task
- Quá hạn: X task
- Sắp đến hạn (7 ngày): X task

## 📅 Lịch hẹn sắp tới
[danh sách deals có appointment]

## 🔴 Việc cần xử lý ngay
[task quá hạn + deals quan trọng]
```

Lưu file tại: `reports/bao-cao-bd-tuan-{YYYY-WW}.md`

---

## Bước 3 — Báo cáo kết quả

```
✅ Báo cáo tuần đã tạo xong!

📄 File: reports/bao-cao-bd-tuan-{tuan}-{nam}.md

📊 Tóm tắt nhanh:
   • Pipeline: {so_deal_active} deals · {pipeline_value} VNĐ
   • Đã chốt tuần này: {closed_value} VNĐ
   • Task quá hạn: {overdue_count}
   • Task hoàn thành: {done_count}

💡 Copy nội dung file để paste vào Zalo nhóm / Google Chat / email báo cáo.
```

---

## Lưu ý

- File JSON phải là export trực tiếp từ BD Manager (nút "Xuất dữ liệu")
- Ngày trong JSON là ISO string (UTC+7 đã được app xử lý)
- Script bổ trợ: `scripts/gen_report.py`
