# BD Manager 🚀

Mini tool quản lý công việc dành cho đội **Business Development** — chạy trực tiếp trên trình duyệt, không cần server, không cần cài đặt.

---

## ✨ Tính năng

### 📊 Luồng Deal (Pipeline Kanban)
- Bảng Kanban kéo thả deal qua 6 giai đoạn: **MQL → SAL → SQL → CONTRACT → CUS/Won → Lost**
- Mỗi deal card hiển thị: tên khách hàng, công ty, giá trị hợp đồng, ngày hẹn (highlight nếu sắp đến/quá hạn), người phụ trách, tiến độ task
- Tự động ghi lịch sử khi chuyển giai đoạn

### ✅ Công việc (Task & Subtask)
- Task cha gắn với từng deal, bên trong có nhiều **subtask**
- Thêm subtask nhanh ngay trong danh sách, không cần mở modal
- Nhóm task theo: Quá hạn / Hôm nay & Sắp đến / Sắp tới / Hoàn thành
- Filter theo trạng thái, deal, mức độ ưu tiên, tìm kiếm

### 🔔 Nhắc nhở thông minh
| Kiểu nhắc | Mô tả |
|---|---|
| **Một lần** | Nhắc đúng ngày giờ chỉ định |
| **Hàng ngày** | Nhắc mỗi ngày từ ngày bắt đầu đến ngày kết thúc |
| **Hàng tuần** | Nhắc cùng thứ trong tuần |
| **Ngày làm việc (T2–T6)** | Nhắc mỗi ngày làm việc |
| **Trước hạn N ngày** | Tự động nhắc N ngày trước deadline |

- Thông báo hiển thị tên tất cả **người được assign** vào task
- Nút **"Copy gửi nhóm"** để copy nội dung nhắc và paste vào Zalo / Slack / Teams

### 📈 Dashboard
- Stat cards: deal active, doanh thu đã chốt, pipeline dự kiến (theo xác suất), task quá hạn
- **Funnel chart** theo từng giai đoạn với giá trị tổng
- Lịch hẹn sắp tới
- Danh sách task quá hạn

---

## 🚀 Cách sử dụng

### Mở app
1. Clone repo hoặc download ZIP
2. Double-click file `index.html` — mở trực tiếp bằng Chrome / Safari / Edge

```bash
git clone https://github.com/trankhanhlinh-katelyn/bd-manager.git
cd bd-manager
open index.html   # macOS
```

> **Không cần server, không cần internet sau khi tải về.**

### Lần đầu mở
App tự load **dữ liệu mẫu** gồm 4 deal và 2 task để bạn xem thử giao diện ngay.

---

## 💾 Dữ liệu

- Tất cả dữ liệu lưu trong **localStorage** của trình duyệt — không gửi đi đâu cả
- Nút **"Xuất dữ liệu"** (sidebar dưới cùng) → tải file `.json` để backup hoặc chia sẻ với đồng đội

---

## 🗂 Cấu trúc dự án

```
bd-manager/
├── index.html          # Entry point
├── css/
│   └── style.css       # Toàn bộ giao diện
└── js/
    ├── storage.js      # CRUD & localStorage
    ├── utils.js        # Helper functions, modal, toast
    ├── pipeline.js     # Kanban board + drag & drop
    ├── tasks.js        # Danh sách task & subtask
    ├── dashboard.js    # Dashboard & stats
    ├── modals.js       # Tất cả form modal
    └── app.js          # App init & notification system
```

---

## 🔮 Roadmap

- [ ] Import dữ liệu từ JSON (đồng bộ đồng đội)
- [ ] Gửi nhắc nhở qua email / Zalo webhook
- [ ] Gắn file đính kèm vào deal
- [ ] Báo cáo doanh thu theo tháng
- [ ] Multi-user với backend (Firebase / Supabase)

---

## 🛠 Tech stack

- **Vanilla HTML / CSS / JavaScript** — không framework, không dependency
- Chạy hoàn toàn offline qua `file://` protocol
- Browser Notification API cho nhắc nhở
- localStorage cho lưu trữ dữ liệu

---

*Built with ❤️ for BD teams. Powered by [Claude Code](https://claude.ai/claude-code).*
