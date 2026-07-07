---
name: bd-weekly-report
description: |
  Dùng skill này khi user muốn tạo báo cáo BD tuần, xem tổng quan pipeline deals,
  thống kê task hoàn thành/quá hạn, hoặc tóm tắt hoạt động kinh doanh trong tuần.
  Kích hoạt khi user đề cập đến: báo cáo tuần, weekly report, xuất báo cáo BD,
  tổng kết tuần, hoặc cung cấp file JSON export từ BD Manager (file có trường exportedAt,
  deals[], tasks[]). Skill đọc dữ liệu export, phân tích pipeline theo stage, task theo
  trạng thái, lịch hẹn sắp tới, và xuất file báo cáo markdown tại reports/.
tools: [Read, Write, Bash]
---

## Mô tả

Skill tạo báo cáo BD tuần từ file export JSON của BD Manager. Tổng hợp deals theo giai đoạn, task hoàn thành/quá hạn, lịch hẹn, và pipeline doanh thu.

---

## Bước 0 — Kiểm tra file input

Nếu user chưa cung cấp file JSON:

```
📋 Để tạo báo cáo, cần export dữ liệu từ BD Manager trước:
   1. Mở file index.html trong trình duyệt
   2. Click nút "Xuất dữ liệu" ở sidebar dưới cùng
   3. Lưu file .json về máy
   4. Cung cấp đường dẫn file để tiếp tục
```

Dừng lại và chờ user cung cấp file.

Nếu có file: dùng Read tool đọc, kiểm tra format `{ exportedAt, deals[], tasks[] }`.

---

## Bước 1 — Parse và phân tích dữ liệu

**Deals** — đếm và tính giá trị theo stage:
- Stages: `MQL / SAL / SQL / CONTRACT / CUS / FAIL`
- Pipeline value = tổng `(giá trị × xác suất)` cho deals chưa đóng
- Closed value = tổng giá trị deals stage `CUS`
- Upcoming appointments = deals có `appointment` trong 7 ngày tới

**Tasks** — phân loại:
- Quá hạn: `dueDate < hôm nay` và `status ≠ done`
- Hoàn thành trong tuần: `status = done` và `updatedAt` trong 7 ngày qua
- Sắp đến hạn: `dueDate` trong 7 ngày tới và `status ≠ done`

---

## Bước 2 — Tạo file báo cáo

Chạy script bổ trợ:

```bash
python3 scripts/gen_report.py [path-to-json] reports/bao-cao-bd-tuan-{YYYY-WW}.md
```

Cấu trúc báo cáo:

```markdown
# BÁO CÁO BD TUẦN [W]/[YYYY]
**Từ:** DD/MM — **Đến:** DD/MM

## 📊 Tổng quan Pipeline
| Giai đoạn | Số deal | Giá trị (VNĐ) |

## 💰 Doanh thu
- Pipeline dự kiến (theo xác suất): X VNĐ
- Đã chốt (CUS): X VNĐ

## ✅ Tình trạng Task
- Hoàn thành: X | Quá hạn: X | Sắp đến hạn: X

## 📅 Lịch hẹn sắp tới (7 ngày)
## 🔴 Task quá hạn cần xử lý ngay
```

---

## Bước 3 — Báo cáo kết quả

```
✅ Báo cáo tuần đã tạo xong!

📄 File: reports/bao-cao-bd-tuan-{tuan}-{nam}.md

📊 Tóm tắt:
   • Pipeline: {so_deal_active} deals · {pipeline_value} VNĐ
   • Đã chốt: {closed_value} VNĐ
   • Task quá hạn: {overdue_count}
   • Task hoàn thành tuần này: {done_count}

💡 Copy nội dung file để paste vào Zalo nhóm / email báo cáo.
```

---

## Lưu ý

- File JSON phải là export từ BD Manager (nút "Xuất dữ liệu")
- Script bổ trợ: `scripts/gen_report.py`
- Output lưu tại `reports/` (đã gitignore, không bị commit)
