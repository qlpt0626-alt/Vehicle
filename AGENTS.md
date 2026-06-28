# KIẾN TRÚC CHUẨN CỦA ỨNG DỤNG - REPAIR MANAGEMENT

**MỤC TIÊU HỆ THỐNG**
Ứng dụng quản lý xe vào sửa chữa hỗ trợ các bộ hồ sơ:
- Hồ sơ xe
- Biên bản giao nhận
- Biên bản kiểm chọn
- Hồ sơ sửa chữa
- Phiếu kiểm tra, phiếu nghiệm thu, các biểu mẫu kỹ thuật khác.

**FIRESTORE LÀ BỘ NHỚ GỐC (Permanent Storage)**
- Mọi dữ liệu chính thức đều lưu tại Firestore.

**LOCAL STORAGE LÀ BỘ NHỚ TẠM (Working Cache)**
- Chỉ dùng để tăng tốc hiển thị, lưu trạng thái làm việc và hỗ trợ offline tạm thời.
- KHÔNG dùng làm nơi lưu dữ liệu chính thức.

**QUY TẮC XÓA DỮ LIỆU (SOFT DELETE)**
- TUYỆT ĐỐI KHÔNG dùng `deleteDoc()` trừ khi là Admin thao tác xóa vĩnh viễn.
- Khi người dùng nhấn Xóa:
  1. Xóa trong cache LocalStorage.
  2. Cập nhật Firestore:
     ```json
     {
       "isDeleted": true,
       "deletedAt": "serverTimestamp()",
       "deletedBy": "currentUser.uid"
     }
     ```
- Dữ liệu đã xóa không hiển thị trên UI, refresh không hiển thị, nhưng Firestore vẫn lưu trữ.
- Admin có tính năng khôi phục: `{"isDeleted": false}`.

**CƠ SỞ DỮ LIỆU BIỂU MẪU (UNIFIED FORMS COLLECTION)**
- Ứng dụng có nhiều tab, KHÔNG tạo nested collections hoặc các collections rời rạc cho từng module.
- Sử dụng chung 1 collection: `repairForms` (hoặc `repairDocuments`).
- Mọi biểu mẫu phải có:
  - `vehicleId`
  - `templateType` (VD: `ENGINE_PRE_REPAIR`, `CHASSIS_PRE_REPAIR`, `ELECTRICAL_PRE_REPAIR`, `RECEPTION_PROTOCOL`, `DAMAGE_PROTOCOL`)
  - `templateName`

**HIỂN THỊ DỮ LIỆU TRÊN TAB**
- Mỗi tab CHỈ ĐƯỢC PHÉP hiển thị dữ liệu thỏa mãn:
  - `vehicleId` hiện tại
  - AND `templateType` hiện tại (Ví dụ: Tab Động cơ chỉ hiển thị format loại ENGINE_PRE_REPAIR)
  - AND `isDeleted != true`

**MỞ RỘNG BIỂU MẪU MỚI**
- Kế thừa hệ thống lưu (Firestore), phân quyền, và Soft Delete hiện có.
- KHÔNG tạo collection mới nếu không thực sự cần thiết.

**ĐỊNH DẠNG BIỂU MẪU KỸ THUẬT**
- Font: Times New Roman
- Khổ in: A4 (hỗ trợ in, zoom, cuộn, xuất PDF)

**SCALABILITY**
- Kiến trúc phục vụ hàng trăm loại biểu mẫu, hàng nghìn xe, nhiều user/admin mà không rò rỉ dữ liệu chéo nhau qua các view.
