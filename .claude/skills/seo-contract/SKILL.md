---
name: seo-contract
description: |
  Dùng skill này khi user muốn tạo hợp đồng dịch vụ SEO (.docx) cho khách hàng mới của SEONGON.
  Kích hoạt khi user đề cập đến: tạo hợp đồng SEO, xuất hợp đồng, làm hợp đồng cho khách,
  cung cấp link Google Sheets/Docs chứa thông tin khách hàng, hoặc cung cấp đường dẫn file CSV
  thông tin khách hàng. Skill sẽ tự sinh template CSV nếu chưa có thông tin, hoặc đọc thông tin
  đã điền để tạo file .docx hoàn chỉnh theo hợp đồng khung chuẩn của SEONGON (Điều I–X + Phụ lục 01 + 02).
tools: [Read, Write, Bash]
---

## Mô tả

Skill tạo hợp đồng SEO tự động: đọc thông tin khách hàng từ CSV/Google Sheets, điền vào hợp đồng khung của SEONGON, xuất file `.docx` sẵn sàng ký.

---

## Bước 0 — Kiểm tra và tạo template thông tin

**Danh sách 41 trường bắt buộc:**

```
[BÊN A]
A01. ten_cong_ty       A02. ho_ten_dai_dien   A03. chuc_vu
A04. so_uy_quyen       A05. ngay_uy_quyen     A06. dia_chi
A07. so_dien_thoai     A08. ma_so_thue        A09. so_tai_khoan
A10. ngan_hang

[HỢP ĐỒNG]
B01. so_hop_dong       B02. ngay_ky           B03. website

[DỰ ÁN]
C01. goi_dich_vu       C02. thoi_gian_du_an   C03. thoi_gian_onpage
C04. thoi_gian_day_top C05. ngay_bat_dau

[KPIs]
D01. kpi_top5_pct      D02. kpi_top10_pct     D03. kpi_traffic
D04. kpi_aio_top3_pct* D05. kpi_aio_kw_pct*   D06. so_luong_tu_khoa

[TÀI CHÍNH]
E01. gia_tri_co_vat    E02. chi_phi_onpage    E03. chi_phi_top5
E04. chi_phi_top10     E05. vat_pct

[THANH TOÁN — 3 đợt]
F01. dot1_pct  F02. dot1_dieu_kien  F03. dot2_pct  F04. dot2_dieu_kien
F05. dot3_pct  F06. dot3_dieu_kien

[BẢO HÀNH]
G01. bao_hanh_thang

[ĐẦU MỐI BÊN A]
H01. dau_moi_ho_ten    H02. dau_moi_chuc_vu
H03. dau_moi_email     H04. dau_moi_sdt

* Tùy chọn — để trống nếu không cam kết AIO
```

### Nếu chưa có file/link thông tin khách hàng:

Tạo file `contracts/template-thong-tin-khach-hang.csv`:

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

Sau khi tạo, hướng dẫn:

```
📋 Đã tạo file template tại: contracts/template-thong-tin-khach-hang.csv

Option 1 – Google Sheets (khuyên dùng):
  1. Upload CSV lên Google Drive → Mở bằng Google Trang tính
  2. Điền đầy đủ cột "Gia_tri"
  3. Share → Bất kỳ ai có link → Copy link
  4. Cung cấp link để tiếp tục tạo hợp đồng

Option 2 – Điền trực tiếp:
  1. Mở file CSV bằng Excel / Numbers
  2. Điền đầy đủ cột Gia_tri, lưu lại
  3. Cung cấp đường dẫn file để tiếp tục
```

**Dừng lại, chờ user cung cấp file/link đã điền đầy đủ.**

---

## Bước 1 — Đọc hợp đồng khung

```bash
curl -L -s "https://docs.google.com/document/d/1r47Y2C3CQ7IBi3SVcgztSQ-ty3MuEjtp9oyTVArKhzI/export?format=txt" -o /tmp/hd_khung.txt
```

Đọc `/tmp/hd_khung.txt` bằng Read tool.

---

## Bước 2 — Đọc và parse thông tin khách hàng

- **Google Sheets link**: đổi `/edit...` → `/export?format=csv`, curl về `/tmp/kh_info.csv`
- **Google Docs link**: đổi `/edit...` → `/export?format=txt`, curl về `/tmp/kh_info.txt`
- **File local .csv**: Read tool đọc trực tiếp

Parse cột `Gia_tri`. Validate 41 trường — nếu còn trống (trừ AIO và giấy uỷ quyền nếu không áp dụng), hỏi user bổ sung trước khi tiếp tục.

---

## Bước 3 — Tạo hợp đồng .docx

Viết script Python vào `/tmp/gen_hd.py` và chạy qua Bash:

1. `pip3 install python-docx -q` nếu chưa có
2. A4, Times New Roman 13pt, margins chuẩn hợp đồng
3. Điền toàn bộ Điều I–X + Phụ lục 01 + 02 từ dữ liệu khách hàng
4. Tính tự động:
   - `gia_tri_chua_vat = round(gia_tri_co_vat / (1 + vat_pct/100))`
   - `tien_vat = gia_tri_co_vat - gia_tri_chua_vat`
   - `dotX_tien = gia_tri_co_vat × dotX_pct / 100`
5. Lưu: `contracts/hop-dong-seo-{slug-ten-khach}-{YYYY-MM-DD}.docx`

---

## Bước 4 — Báo cáo kết quả

```
✅ Hợp đồng đã tạo xong!

📄 File: contracts/hop-dong-seo-{ten-khach}-{ngay}.docx
   (Upload Google Drive → chuột phải → Mở bằng Google Tài liệu)

📋 Thông tin đã điền:
   • Khách hàng : {ten_cong_ty}
   • Đại diện   : {ho_ten_dai_dien} – {chuc_vu}
   • Website    : {website}
   • Thời gian  : {thoi_gian_du_an} tháng ({ngay_bat_dau})
   • KPIs       : TOP5={kpi_top5_pct}% | TOP10={kpi_top10_pct}% | Traffic +{kpi_traffic}/tháng
   • Giá trị    : {gia_tri_co_vat} VNĐ (gồm VAT {vat_pct}%)
   • Thanh toán : {dot1_pct}% – {dot2_pct}% – {dot3_pct}%
   • Bảo hành   : {bao_hanh_thang} tháng

⚠️ Cần bổ sung thủ công:
   □ Danh sách từ khóa (Phụ lục 01)
   □ Thông tin đầu mối Bên B (PM/AM phụ trách)
```

---

## Lưu ý

- Không để trống bất kỳ trường nào (trừ AIO và giấy uỷ quyền nếu không áp dụng)
- Không tự suy đoán số tiền — nếu thiếu breakdown, hỏi user
- Giữ nguyên văn toàn bộ điều khoản pháp lý, chỉ thay thế trường thông tin
- Output luôn là `.docx`
