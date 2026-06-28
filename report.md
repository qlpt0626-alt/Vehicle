# Báo cáo Phân tích Lỗi và ID hệ thống

Báo cáo này được tổng hợp từ 4 yêu cầu phân tích dữ liệu và kiến trúc liên quan đến Thùng rác, Nguồn ID, và Fallback `vehicleId`.

## 1. Phân tích lỗi React trong Thùng rác (TrashTab.tsx)
- **Key render hiện tại:** Trong `TrashTab.tsx`, thẻ `tr` đang sử dụng `key={`${item.type}-${item.id}`}`.
- **Vấn đề trùng `id` khác `type`:** Nếu một xe (VD: `vehicleId = 'V001'`) bị xóa, sẽ sinh ra 1 item `{type: 'VEHICLE', id: 'V001'}`. Nếu file Biên bản kiểm chọn của xe đó cũng bị ép dùng `id = 'V001'` và bị xóa, sinh ra item `{type: 'INSPECTION_FORM', id: 'V001'}`.
- **Đánh giá logic Key:** React key cho 2 mục trên sẽ là `VEHICLE-V001` và `INSPECTION_FORM-V001`. Do có prefix là `item.type`, chúng **chắc chắn khác nhau** ở cấp độ String. Do đó, React không thể báo lỗi trùng key vì cùng một `id` nếu chúng khác loại.
- **Tác động từ phần mã hiển thị `(Xe AC-11)`:** Phần sửa `getSystemTrash()` trước đó chỉ chèn biển số vào string thuộc tính `name` (Ví dụ: `name: Biên bản... (Xe AC-11)`). Nó tuyệt đối KHÔNG làm tăng số phần tử của mảng, KHÔNG sinh trùng lặp. Lỗi "Duplicate child key" (nếu có) thường là do có 2 item cùng một Collection có chung `id`.

## 2. Phân tích dữ liệu vehicleInspectionForms bị xóa
- **Các field hiện có:** `id` (nếu đọc từ Firestore là document ID), `docId` (thường trống lúc gửi upload), `protocolId` (tạo sau hàm `save`), `vehicleId`, `createdAt`, `updatedAt`, `isDeleted`.
- **Cơ chế lưu trữ:** Khi lưu DB thông qua `DataService.save('vehicleInspectionForms', data)`, `data` không có sẵn field `.id`. Do đó `docId` bị Firebase Fallback gán bằng `data.vehicleId`. 
- **Tác động:** Toàn bộ bản ghi của collection `vehicleInspectionForms` đều lấy `document.id` trên Firestore là `vehicleId`.
- **Hiện tượng Overwrite:** Một xe bất kỳ chỉ có thể tồn tại **DUY NHẤT MỘT** Biên bản kiểm chọn trên Database tại một thời điểm (kể cả xóa hay không xóa). Tạo bản thứ 2 sẽ lưu đè hoàn toàn bản cũ. Vì chúng đè lên nhau, nên trong Trash sẽ không bao giờ có chuyện 2 record cùng tên `INSPECTION_FORM` lại cùng `id` (vì Firestore đã nuốt mất bản trước đó).
- **Đề xuất trường dùng làm Key:** Nên sử dụng trường `protocolId` (VD: `DP-123456`) hoặc tự sinh UUID làm key cấp độ Database (`document.id`) để đảm bảo tính unique.

## 3. Phân tích Nguồn ID của repairForms và vehicleInspectionForms
- **repairForms:** Các thành phần UI (VD: `EngineInspectionBeforeRepairForm.tsx`) đã **chủ động sinh** `docId` trước theo định dạng `EIR_v001_123123` và gán vào `payload.id`. Do đó `document.id` MAP ĐÚNG vào object. Repair Forms không bị đè dữ liệu.
- **vehicleInspectionForms:** Mặc định không có field `id` lúc payload được xử lý. Khi đọc ở Firestore về, field `id` được fill tự động map nhờ `doc => { id: doc.id, ...doc.data() }`. Dù có `id`, nhưng bản chất giá trị `id` đó lại chính là `vehicleId`.
- **Thống kê Record:** (Về mặt code không có log thống kê chính xác số liệu, tuy nhiên 100% record của vehicleInspectionForms đều bị thiếu id thực sự và mang document.id là vehicleId).
- **Kết luận:** **Có thể** dùng `document.id` làm ID duy nhất định danh sự kiện trong Thùng Rác. Vì mọi document trên Firestore thuộc 1 collection luôn unique. Việc ghép `${item.type}-${item.id}` (phản chiếu từ `doc.id` qua) là cấu trúc Key lý tưởng và cực kỳ an toàn. Nhưng trước hết, ta phải sửa việc vehicleInspectionForms bị đè.

## 4. Phân tích cấu trúc Fallback Document ID trên diện rộng
- **Kịch bản:** Dòng code `docId = data.protocolId || data.historyId || data.vehicleId;` ở `firebase.js`.
- **Mức độ ảnh hưởng Overwrite:** Rất nghiêm trọng ở `vehicleInspectionForms` (sử dụng `vehicleId` làm khóa chính document, 100% tài liệu bị ghi đè nếu cùng xe). Với `damageProtocols` ít lo hơn do tạo ID trước. `repairForms` an toàn vì sinh `docId` trước tương đối triệt để.
- **Nếu bỏ fallback:** Những hàm như `saveVehicleInspectionForm` sẽ lưu dữ liệu vào 1 document mã Hash ngẫu nhiên do Firebase cấp. Lỗi phát sinh ngay lập tức ở chức năng xem/cập nhật vì mã code ở dbService (ví dụ lấy danh sách, kiểm tra data) đang kỳ vọng "ID của biên bản xe A chính là mã xe A" thay vì phải đi tìm protocolId.
- **Chiến lược Migration An Toàn:** 
  1. Cập nhật phương thức chức năng như `saveVehicleInspectionForm` tạo ID tự động theo timestamp hoặc protocolId (VD: `INS_Date`).
  2. Truyền ID đã tạo vào payload dưới field `.id` để ngăn fallback trong `firebase.js` can thiệp.
  3. Quét toàn bộ DB Firestore của `vehicleInspectionForms`, map data cũ ra Document mới bằng ID chuẩn, xóa Document có khóa nhầm là `vehicleId` cũ đi.
