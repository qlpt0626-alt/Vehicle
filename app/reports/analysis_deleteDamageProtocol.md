# Phân tích hàm deleteDamageProtocol trong dbService.ts

## 1. Đoạn mã liên quan được tìm thấy

Trong nội dung hàm `deleteDamageProtocol` (khoảng dòng 1094-1098), tồn tại đoạn mã sau:
```typescript
try {
  await DataService.update('vehicleInspectionForms', protocolId, updatePayload);
} catch (err) {
  console.warn("Soft delete of corresponding inspection form failed in in Firestore:", err);
}
```

## 2. Đánh giá tính cần thiết và mục đích ban đầu
* **Mục đích ban đầu:** Đoạn code này được viết ra dựa trên thiết kế (hoặc lỗi thiết kế) cũ khi một "Biên bản" có thể vừa tồn tại trong collection `damageProtocols` vừa được cache/clone sang collection `vehicleInspectionForms`. Mục đích là để phòng ngừa: thao tác xóa một Biên bản giao nhận không bị "sót" dữ liệu ở bên `vehicleInspectionForms`. 
* **Sự phù hợp với kiến trúc hiện tại:** Kiến trúc hiện tại quy định mỗi loại document (Military, Damage,...) có ranh giới schema và template type rõ ràng, hoặc hướng tới mục tiêu dùng chung một Unified Form Collection (`repairForms` / `repairDocuments`). Việc một ID cụ thể vừa là của `damageProtocols` vừa phải tìm kiếm trong `vehicleInspectionForms` để cập nhật Soft Delete là **không còn phù hợp**. Nó tạo ra các request thừa thãi, gây lãng phí read/write quota trên Firestore và gây ra các log lỗi hệ thống vô giá trị.

## 3. Quá trình xử lý lỗi khi Document không tồn tại
* Khi đoạn code này thực thi và không tìm thấy bản ghi nào mang ID `protocolId` trong collection `vehicleInspectionForms`, Firebase/Firestore API sẽ throw ra error (Not Found).
* Tuy nhiên, hệ thống **đang catch được lỗi này** bằng blok `try...catch` và chỉ in một cảnh báo màu vàng ra giao diện console: `console.warn("Soft delete of corresponding inspection form failed in in Firestore:", err);`.
* Do nhánh xử lý ngoại lệ chỉ `console.warn` mà không throw tiếp, hệ thống UI sẽ **không bị vỡ**, cũng **không xuất hiện màn hình đỏ hoặc Toast (popup) báo lỗi** cho người dùng. Ứng dụng vẫn âm thầm thực thi xong hàm và ẩn Biên bản bên phía Client.

## 4. Đề xuất cải tiến kiến trúc (Không sửa code theo yêu cầu)
Theo đúng quy tắc và hạn chế rủi ro cho cấu trúc Soft Delete:
1. **Chỉ Soft Delete collection tương ứng:** Hàm `deleteDamageProtocol` nên tập trung độc quyền vào việc cập nhật trên duy nhất collection `damageProtocols`.
2. **Loại bỏ đoạn update thừa:** Xóa hoàn toàn khối lệnh `try...catch` gọi `DataService.update('vehicleInspectionForms', ...)` để không đụng tới collection không liên quan, qua đó triệt tiêu triệt để các API Calls dư thừa và các cảnh báo WARN rác trên console khi document không tồn tại.
