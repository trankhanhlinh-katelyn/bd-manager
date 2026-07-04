---
name: seo-contract
description: Tạo hợp đồng SEO (.docx) tự động từ hợp đồng khung SEONGON. Nếu thiếu thông tin, tự sinh file CSV template để user điền đủ rồi gọi lại.
allowed-tools: WebFetch, Read, Write, Bash
user-invokable: true
---

Khi user gọi `/seo-contract [link-hoặc-path]`, thực hiện **đúng thứ tự** các bước dưới đây.

---

## Bước 0 — Kiểm tra và tạo template thông tin

**Danh sách 41 trường bắt buộc** cần có để tạo hợp đồng:

```
[BÊN A]
A01. ten_cong_ty          — Tên công ty đầy đủ
A02. ho_ten_dai_dien      — Họ tên người đại diện ký
A03. chuc_vu              — Chức vụ
A04. so_uy_quyen          — Số giấy uỷ quyền (nếu ký thay GĐ; để trống nếu GĐ tự ký)
A05. ngay_uy_quyen        — Ngày lập giấy uỷ quyền (DD/MM/YYYY)
A06. dia_chi              — Địa chỉ đầy đủ
A07. so_dien_thoai        — Số điện thoại
A08. ma_so_thue           — Mã số thuế
A09. so_tai_khoan         — Số tài khoản ngân hàng Bên A
A10. ngan_hang            — Tên ngân hàng Bên A

[HỢP ĐỒNG]
B01. so_hop_dong          — Số hợp đồng (vd: 127/2026/HĐ-SEO)
B02. ngay_ky              — Ngày ký (DD/MM/YYYY)
B03. website              — URL website cần SEO (https://...)

[DỰ ÁN]
C01. goi_dich_vu          — Tên gói (vd: SEO AI Max)
C02. thoi_gian_du_an      — Tổng thời gian dự án (số tháng)
C03. thoi_gian_onpage     — Thời gian Onpage (số tháng)
C04. thoi_gian_day_top    — Thời gian đẩy top (số tháng)
C05. ngay_bat_dau         — Ngày bắt đầu dự kiến (MM/YYYY)

[KPIs]
D01. kpi_top5_pct         — % từ khóa vào TOP 5 (số)
D02. kpi_top10_pct        — % từ khóa vào TOP 10 (số)
D03. kpi_traffic          — Organic traffic tăng thêm (click/tháng)
D04. kpi_aio_top3_pct     — % hiển thị AIO Top 3 (số; để trống nếu không cam kết AIO)
D05. kpi_aio_kw_pct       — % từ khóa hiển thị AIO (số; để trống nếu không cam kết AIO)
D06. so_luong_tu_khoa     — Tổng số từ khóa đẩy TOP

[TÀI CHÍNH]
E01. gia_tri_co_vat       — Tổng giá trị HĐ đã gồm VAT (số, VNĐ)
E02. chi_phi_onpage       — Chi phí Tư vấn Onpage, chưa VAT (số, VNĐ)
E03. chi_phi_top5         — Chi phí Tối ưu TOP 5, chưa VAT (số, VNĐ)
E04. chi_phi_top10        — Chi phí Tối ưu TOP 10, chưa VAT (số, VNĐ)
E05. vat_pct              — Tỷ lệ VAT (số, thường là 8)

[THANH TOÁN — 3 đợt]
F01. dot1_pct             — % đợt 1 (vd: 40)
F02. dot1_dieu_kien       — Điều kiện đợt 1 (vd: Tạm ứng khi ký HĐ)
F03. dot2_pct             — % đợt 2 (vd: 30)
F04. dot2_dieu_kien       — Điều kiện đợt 2 (vd: Hoàn thành nghiệm thu Onpage)
F05. dot3_pct             — % đợt 3 (vd: 30)
F06. dot3_dieu_kien       — Điều kiện đợt 3 (vd: Hoàn thành KPIs)

[BẢO HÀNH]
G01. bao_hanh_thang       — Thời gian bảo hành (số tháng)

[ĐẦU MỐI BÊN A]
H01. dau_moi_ho_ten       — Họ tên đầu mối dự án Bên A
H02. dau_moi_chuc_vu      — Chức vụ
H03. dau_moi_email        — Email
H04. dau_moi_sdt          — Số điện thoại
```

### Nếu user CHƯA cung cấp link/file, hoặc file còn thiếu trường:

Tạo file template CSV tại `contracts/template-thong-tin-khach-hang.csv` bằng Write tool với nội dung:

```
Nhom,Truong,Mo_ta,Gia_tri,Vi_du
BEN_A,ten_cong_ty,Tên công ty đầy đủ (ghi chính xác như đăng ký kinh doanh),,CÔNG TY CỔ PHẦN ABC
BEN_A,ho_ten_dai_dien,Họ tên người đại diện ký hợp đồng,,Bà Nguyễn Thị A
BEN_A,chuc_vu,Chức vụ,,Giám Đốc
BEN_A,so_uy_quyen,Số giấy uỷ quyền (để trống nếu GĐ ký),,166B/2024/GUQ-TDH
BEN_A,ngay_uy_quyen,Ngày lập giấy uỷ quyền (DD/MM/YYYY),,01/10/2024
BEN_A,dia_chi,Địa chỉ đầy đủ,,123 Đường ABC - Quận 1 - TP.HCM
BEN_A,so_dien_thoai,Số điện thoại,,02436877777
BEN_A,ma_so_thue,Mã số thuế,,0108705693
BEN_A,so_tai_khoan,Số tài khoản ngân hàng,,0021116609999
BEN_A,ngan_hang,Tên ngân hàng và chi nhánh,,Ngân hàng TMCP Quân Đội – CN Sở Giao Dịch 1
HOP_DONG,so_hop_dong,Số hợp đồng,,127/2026/HĐ-SEO
HOP_DONG,ngay_ky,Ngày ký (DD/MM/YYYY),,03/07/2026
HOP_DONG,website,URL website cần SEO,,https://shop.example.com/
DU_AN,goi_dich_vu,Tên gói dịch vụ,,SEO AI Max
DU_AN,thoi_gian_du_an,Tổng thời gian dự án (số tháng),,4
DU_AN,thoi_gian_onpage,Thời gian Onpage (số tháng),,1
DU_AN,thoi_gian_day_top,Thời gian đẩy top (số tháng),,3
DU_AN,ngay_bat_dau,Ngày bắt đầu dự kiến (MM/YYYY),,07/2026
KPIs,kpi_top5_pct,% từ khóa vào TOP 5,,10
KPIs,kpi_top10_pct,% từ khóa vào TOP 10,,30
KPIs,kpi_traffic,Organic traffic tăng thêm (click/tháng),,2000
KPIs,kpi_aio_top3_pct,% hiển thị AIO Top 3 (để trống nếu không cam kết),, 
KPIs,kpi_aio_kw_pct,% từ khóa hiển thị AIO (để trống nếu không cam kết),, 
KPIs,so_luong_tu_khoa,Tổng số từ khóa đẩy TOP,,100
TAI_CHINH,gia_tri_co_vat,Tổng giá trị HĐ đã gồm VAT (VNĐ),,260000000
TAI_CHINH,chi_phi_onpage,Chi phí Tư vấn Onpage chưa VAT (VNĐ),,
TAI_CHINH,chi_phi_top5,Chi phí Tối ưu TOP 5 chưa VAT (VNĐ),,
TAI_CHINH,chi_phi_top10,Chi phí Tối ưu TOP 10 chưa VAT (VNĐ),,
TAI_CHINH,vat_pct,Tỷ lệ VAT (%),,8
THANH_TOAN,dot1_pct,% đợt 1,,40
THANH_TOAN,dot1_dieu_kien,Điều kiện đợt 1,,Tạm ứng khi ký HĐ và phụ lục
THANH_TOAN,dot2_pct,% đợt 2,,30
THANH_TOAN,dot2_dieu_kien,Điều kiện đợt 2,,Hoàn thành nghiệm thu Onpage
THANH_TOAN,dot3_pct,% đợt 3,,30
THANH_TOAN,dot3_dieu_kien,Điều kiện đợt 3,,Hoàn thành 100% KPIs cam kết
BAO_HANH,bao_hanh_thang,Thời gian bảo hành (số tháng),,3
DAU_MOI_A,dau_moi_ho_ten,Họ tên đầu mối dự án Bên A,,
DAU_MOI_A,dau_moi_chuc_vu,Chức vụ,,
DAU_MOI_A,dau_moi_email,Email,,
DAU_MOI_A,dau_moi_sdt,Số điện thoại,,
```

Sau khi tạo file, hiển thị hướng dẫn:

```
📋 Đã tạo file template thông tin tại:
   contracts/template-thong-tin-khach-hang.csv

Cách dùng (chọn 1 trong 2):

Option 1 – Google Sheets (khuyên dùng):
  1. Mở Google Drive → + Mới → Tải tệp lên → chọn file CSV trên
  2. Chuột phải vào file → Mở bằng Google Trang tính
  3. Điền đầy đủ cột "Gia_tri" cho tất cả các trường
  4. Chia sẻ (Share) → Bất kỳ ai có link → Sao chép link
  5. Gọi lại: /seo-contract [link-google-sheet]

Option 2 – Điền trực tiếp vào file CSV:
  1. Mở file CSV bằng Excel / Numbers / bất kỳ text editor
  2. Điền đầy đủ cột Gia_tri
  3. Lưu lại
  4. Gọi lại: /seo-contract contracts/template-thong-tin-khach-hang.csv
```

**Dừng lại và chờ user cung cấp thông tin đầy đủ trước khi sang Bước 1.**

---

## Bước 1 — Đọc hợp đồng khung

Fetch hợp đồng khung bằng `curl` qua Bash (vì Google Docs redirect sẽ fail nếu dùng WebFetch trực tiếp):

```bash
curl -L -s "https://docs.google.com/document/d/1r47Y2C3CQ7IBi3SVcgztSQ-ty3MuEjtp9oyTVArKhzI/export?format=txt" -o /tmp/hd_khung.txt
```

Đọc file `/tmp/hd_khung.txt` bằng Read tool. Xác định tất cả trường trống trong template.

---

## Bước 2 — Đọc và parse thông tin khách hàng

### Nếu user cung cấp link Google Docs:
- Chuyển `/edit...` → `/export?format=txt`
- Dùng `curl -L -s URL -o /tmp/kh_info.txt`
- Đọc file, map thông tin vào 41 trường

### Nếu user cung cấp link Google Sheets:
- Chuyển `/edit...` → `/export?format=csv`
- Dùng `curl -L -s URL -o /tmp/kh_info.csv`
- Parse CSV, cột "Gia_tri" chứa giá trị cần lấy

### Nếu user cung cấp đường dẫn file local (.csv):
- Dùng Read tool đọc trực tiếp
- Parse CSV, cột "Gia_tri"

### Validate đủ trường:
Kiểm tra 41 trường ở Bước 0. Nếu còn trường nào trống (và không phải trường tùy chọn AIO), **hỏi user bổ sung ngay** trước khi tiếp tục — không được để trống trong hợp đồng.

Trường tùy chọn (có thể bỏ qua nếu để trống):
- `kpi_aio_top3_pct`, `kpi_aio_kw_pct` — bỏ qua nếu không cam kết AIO
- `so_uy_quyen`, `ngay_uy_quyen` — bỏ qua nếu GĐ tự ký

---

## Bước 3 — Tạo hợp đồng .docx

Viết script Python vào `/tmp/gen_hd.py` rồi chạy bằng Bash. Script phải:

1. Import `python-docx` (cài nếu chưa có: `pip3 install python-docx -q`)
2. Tạo Document với định dạng A4, font Times New Roman 13pt, margins chuẩn hợp đồng
3. Điền **toàn bộ nội dung hợp đồng khung** (Điều I → Điều X + Phụ lục 01 + Phụ lục 02) với các thay thế:
   - Số HĐ: `{so_hop_dong}`
   - Ngày ký: `{ngay_ky}`
   - Bên A: `{ten_cong_ty}`, `{ho_ten_dai_dien}`, `{chuc_vu}`, ...
   - Website: `{website}`
   - Thời gian: `{thoi_gian_du_an}`, `{thoi_gian_onpage}`, `{thoi_gian_day_top}`
   - KPIs: `{kpi_top5_pct}`, `{kpi_top10_pct}`, `{kpi_traffic}`
   - Tài chính: `{gia_tri_co_vat}`, các hạng mục chi phí, bảng thanh toán 3 đợt
   - Bảo hành: `{bao_hanh_thang}` tháng
   - Đầu mối Bên A: họ tên, chức vụ, email, SĐT
4. Tạo bảng thanh toán 3 đợt với giá trị tự tính từ `{gia_tri_co_vat}` × tỷ lệ %
5. Tính tự động:
   - `gia_tri_chua_vat = gia_tri_co_vat / (1 + vat_pct/100)` (làm tròn)
   - `tien_vat = gia_tri_co_vat - gia_tri_chua_vat`
   - Giá trị từng đợt = `gia_tri_co_vat × dotX_pct / 100`
6. Lưu vào `contracts/hop-dong-seo-{slug-ten-khach}-{YYYY-MM-DD}.docx`

---

## Bước 4 — Báo cáo kết quả

Sau khi tạo file thành công, hiển thị:

```
✅ Hợp đồng đã tạo xong!

📄 File: contracts/hop-dong-seo-{ten-khach}-{ngay}.docx
   (Mở bằng Word, hoặc upload lên Google Drive → chuột phải → Mở bằng Google Tài liệu)

📋 Thông tin đã điền:
   • Khách hàng : {ten_cong_ty}
   • Đại diện   : {ho_ten_dai_dien} – {chuc_vu}
   • Website    : {website}
   • Thời gian  : {thoi_gian_du_an} tháng ({ngay_bat_dau})
   • KPIs       : TOP5={kpi_top5_pct}% | TOP10={kpi_top10_pct}% | Traffic +{kpi_traffic} click/tháng
   • Giá trị    : {gia_tri_co_vat_formatted} VNĐ (gồm VAT {vat_pct}%)
   • Thanh toán : {dot1_pct}% – {dot2_pct}% – {dot3_pct}%
   • Bảo hành   : {bao_hanh_thang} tháng

⚠️ Kiểm tra lại trước khi ký:
   □ Danh sách từ khóa (Phụ lục 01) — cần bổ sung thủ công
   □ Thông tin đầu mối Bên B (PM/AM phụ trách) — điền trong file
```

---

## Lưu ý quan trọng

- **Không bỏ trống bất kỳ trường nào** trong hợp đồng (trừ 2 trường AIO và giấy uỷ quyền nếu không áp dụng)
- **Không tự suy đoán** số tiền chi tiết từng hạng mục — nếu user không cung cấp breakdown, hỏi
- Giữ **nguyên văn** toàn bộ điều khoản pháp lý của hợp đồng khung, chỉ thay thế các trường thông tin
- Output luôn là **.docx** — không dùng .md hay .txt
- Template CSV lưu tại `contracts/template-thong-tin-khach-hang.csv` để tái sử dụng cho các khách tiếp theo
