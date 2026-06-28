# So sánh MilitaryInspectionForm & DamageProtocolForm

## 1. Trường dữ liệu trên MilitaryInspectionForm
* Số biên bản (`reportNo`)
* Ngày văn bản (`docDate`)
* Tên xe (`vehicleName`)
* Mức sửa chữa (`repairLevel`)
* Nhóm sửa chữa (`repairGroup`)
* Số đăng ký/Biển số (`plateNumber`)
* Số khung lý lịch (`chassisNumber`) & Số khung thực tế (`actualChassisNumber`)
* Số máy lý lịch (`engineNumber`) & Số máy thực tế (`actualEngineNumber`)
* Đơn vị giao (`giverUnit`)
* Bảng kiểm soát Chi tiết Tình trạng đồng bộ dạng Row check (`formData`)
* Tình trạng kỹ thuật tĩnh (Textarea lớn)
* Tình trạng kỹ thuật động (Textarea lớn)
* Đề nghị (Textarea lớn)
* Kết luận tuỳ chỉnh (Textarea lớn)

## 2. Trường dữ liệu trên DamageProtocolForm
* Số hiệu biên bản (`reportNumber`)
* Ngày tháng (`createdDate`)
* Địa điểm (`place`)
* Đại diện chỉ huy (`representativeGeneral`)
* Đại diện kỹ thuật (`representativeTechnical`)
* Trưởng tổ kỹ thuật/Kỹ thuật viên (`technician`)
* Lái xe (`driver`)
* Tên xe (`brand`), Biển số (`plateNumber`), Loại xe (`vehicleType`)
* Số khung (`chassisNumber`), Số máy (`engineNumber`)
* Số KM/Odometer (`odometer`)
* Danh mục hư hỏng (`items`) - Gồm Tên, Tình trạng rỗ máy, Biện pháp sửa.
* Kết luận chung (`conclusion`)

## 3. So sánh tương quan

**A. Có ở Military nhưng KHÔNG CÓ ở Damage Form:**
* Các text kỹ thuật mở rộng: *Tình trạng kỹ thuật tĩnh*, *Tình trạng kỹ thuật động*, *Đề nghị tuỳ chỉnh*.
* Chi tiết kiểm đối chiếu hành chính: *Số máy/Khung thực tế*, *Mức sửa chữa*, *Nhóm sửa chữa*.

**B. Có ở Damage Form nhưng KHÔNG CÓ ở Military Form:**
* Thông tin đại biểu kí kết: *Đại diện kỹ thuật*, *Trưởng tổ kỹ thuật*, *Lái xe*.
* Thông số Odometer.
* Cột giải pháp sửa chữa trong table (`solution` của list mảng items).

## 4. DamageProtocolForm có phải bản in rút gọn của MilitaryInspectionForm?
**ẢO GIÁC.** DamageProtocolForm **KHÔNG PHẢI** là bản in phục vụ cho MilitaryInspectionForm.
Đúng ra, DamageProtocolForm là template "Biên bản kiểm chọn tình trạng hư hỏng" (thuộc tab 2), còn MilitaryInspectionForm là bản thiết kế của "Biên bản giao nhận vào xưởng" (tab 1). Chúng là 2 domain tài liệu khác hẳn nhau.

Biên bản Military sẽ focus vào hiện trạng tổng quan và giao nhận vật lý của các chi tiết thân/vỏ/trang bị đồng bộ đi theo xe. Damage Form focus sâu vào đánh giá hỏng hóc kỹ thuật kĩ càng bên trong khối động cơ để ra quyết định sửa chữa cụm nào, thay phụ tùng gì, kí duyệt bởi quản đốc chuyên môn.

## 5. Những Section bị lược bỏ/hiển thị sai nếu ép DamageProtocolForm hiển thị schema của Military
Nếu hệ thống lồi DamageProtocolForm ra làm component preview cho Military (do bug điều hướng):
* Section "Mức sửa chữa", "Số khung/máy thực tế" bị mù hoàn toàn (không render).
* Section "Tình trạng tĩnh/động/đề nghị" bị xoá trắng vì Damage Form không có thẻ hiển thị cho textarea này.
* Section "Chữ ký" sẽ bị râu ông nọ cắm cằm bà kia (Military quy định "Đại diện đơn vị giao / nhận / Tiểu đoàn", thì Damage lại in "Lái xe / Trưởng ban / Tổ KT").
