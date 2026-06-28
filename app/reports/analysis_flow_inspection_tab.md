# Phân tích luồng click mở Biên bản giao nhận trong InspectionTab.tsx

## 1. Đoạn code render danh sách Damage Protocol
Danh sách Biên bản giao nhận được render bởi component `<DamageProtocolList protocols={allDamageProtocols} />` tại dòng 411 trong file `InspectionTab.tsx`. Component này được gọi khi tab hiện tại là `protocolListTab === 'GIAO_NHAN'`.

## 2. Khi click vào một Biên bản giao nhận
Component `DamageProtocolList` cấp 2 event handlers là `onViewSelect` và `onPrintSelect` phụ thuộc vào hành động nhấn chuột của user (xem chi tiết hay in/sửa):

**Khi click Xem chi tiết (trigger `onViewSelect`):**
State được cập nhật:
* `setViewedProtocol(protocol)`
* `setActiveFormMode('VIEW_PROTOCOL')`

**Khi click nút Chỉnh sửa / Mở chi tiết (trigger `onPrintSelect`):**
State được cập nhật:
* `setCurrentInspection(protocol)`
* `setActiveFormMode('GIAO_NHAN')`

## 3. Trạng thái State liên quan
* `activeFormMode`: Xác định chế độ hiển thị UI, trong luồng này thay đổi sang `'VIEW_PROTOCOL'` (để xem) hoặc `'GIAO_NHAN'` (để sửa qua MilitaryInspectionForm).
* `activeInspection`: (Không thấy khai báo & sử dụng trong nhánh `GIAO_NHAN`).
* `currentInspection`: Chứa toàn bộ dữ liệu JSON của form, được load làm giá trị cho `MilitaryInspectionForm`.
* `viewedProtocol`: Chứa toàn bộ dữ liệu JSON của form, được load làm giá trị tĩnh (view preview).

## 4. Component cuối cùng được mount
Trong chế độ xem `activeFormMode === 'VIEW_PROTOCOL'`, component được mount ra để render giao diện là **`<DamageProtocolForm>`** (dòng 319-326). 
Đặc biệt thẻ bao ngoài bao gồm class `pointer-events-none opacity-95` khiến form này đóng vai trò Read-Only UI (Xem Trước).

## 5. Tại sao document tạo bởi MilitaryInspectionForm lại mở bằng DamageProtocolForm?
Kiến trúc luồng điều hướng cũ đã hardcode rằng mọi click ở chế độ "Xem Chi Tiết" (`VIEW_PROTOCOL`) của tab Biên Bản Giao Nhận đều render `<DamageProtocolForm>`.

Vấn đề là `<MilitaryInspectionForm>` đã được cải tiến để lưu payload trong các trường nội bộ như `headerData` (chứa các text kỹ thuật, header info) và `formData` (chứa list item checkbox dạng hash array), trong khi `<DamageProtocolForm>` vẫn đọc payload theo cấu trúc root cũ (VD: đọc từ thẻ map gốc của `representativeGeneral`, `technician`, `driver`). Khi không tìm thấy field ở root theo chuẩn cũ, `<DamageProtocolForm>` sẽ kích hoạt giá trị default/hardcode (ví dụ điền bừa "Hạ sĩ Nguyễn Văn Hùng", "Tiểu đoàn SCTH30"). Hệ quả người dùng thấy form bị "rỗng" dữ liệu / "trở về mặc định".

## 6. Đề xuất hướng sửa kiến trúc

### Hướng A: Mở lại bằng MilitaryInspectionForm (ĐỀ XUẤT)
* Thay vì duy trì 2 form rời rạc trên 1 chức năng (DamageProtocolForm để View và MilitaryInspectionForm để Edit), ta nên hợp nhất. Khi click list hoặc click Xem, set cứng điều hướng về `activeFormMode = 'GIAO_NHAN'`, tải qua `MilitaryInspectionForm` kèm prop data nguyên thủy.
* Lí do: Component `MilitaryInspectionForm` có sẵn UI chuyên trị định dạng khổ giấy A4, hỗ trợ nút In rất gọn và phục hồi dữ liệu hoàn hảo (`loadRecoveredForm`). Tận dụng View của nó để tiết kiệm chi phí bảo trì state kép.

### Hướng B: Giữ DamageProtocolForm (SỬA DỮ LIỆU)
* Refactor code `DamageProtocolForm.tsx` ở phần khai báo state default, ép component check thêm dữ liệu ở `initialProtocol.headerData.X` hoặc `initialProtocol.formData.Y`.
* Rủi ro: Làm xé nhỏ mô hình dữ liệu. Sau này nếu `MilitaryInspectionForm` sửa đổi tiếp form mới, phải update luôn code HTML trong `DamageProtocolForm` làm mất thời gian.
