# Phân tích nguồn sinh Popup lỗi: "Firestore Error in DataService"

## 1. Nơi phát sinh chuỗi thông báo
Từ khóa `Firestore Error in DataService` được log ra trực tiếp tại:
- **File:** `src/firebase.js`
- **Hàm:** `handleFirestoreError(error, operationType, path)`
- **Dòng code:** `126` (bên trong hàm `handleFirestoreError`). Cú pháp: `console.error("Firestore Error in DataService: ", JSON.stringify(errInfo));`

## 2. Quá trình tạo Toast/Popup trên màn hình
Ai là nơi biến câu `console.error` này thành popup đỏ trên màn hình? Nơi chịu trách nhiệm chính là file `src/utils/logger.ts`.
- Trong `logger.ts` (từ dòng 29-60), hệ thống đã "chiếm quyền" (override) hàm `console.error` mặc định của window.
- Khi tệp `firebase.js` gọi lệnh `console.error("Firestore Error in DataService: "...)`, bộ đệm `Logger` bắt được lệnh này và đẩy vào danh sách `this.logs` với dạng `LogMessage` type: 'error'.
- Bất kì component UI nào đang `subscribe` vào Logger sẽ ngay lập tức nhận biết và render màn hình báo lỗi/Toast màu đỏ với nội dung rút gọn chính là tham số đầu tiên của log: **"Firestore Error in DataService: "**

## 3. Xác minh chuỗi sự kiện luồng xóa (`deleteDamageProtocol`)

Luồng xóa xảy ra lỗi và sinh popup **có tồn tại** một cách trọn vẹn theo các bước sau:
1. `deleteDamageProtocol` gọi hàm update lên đối tượng lưu trữ phụ: `DataService.update('vehicleInspectionForms', protocolId, ...);` (trong `src/services/dbService.ts`)
2. Bên trong `DataService.update`, hệ thống gọi hàm `updateDoc()` của Firebase SDK. Firebase phản hồi lỗi `NOT_FOUND` do văn bản không tồn tại.
3. `DataService.update` hứng lỗi này trong khối HTTP request, và chuyển tiếp nó vào hàm `handleFirestoreError`.
4. Hàm `handleFirestoreError` lập tức gọi `console.error("Firestore Error in DataService...")`.
5. `logger.ts` chặn `console.error` này và lập tức tạo ra một Toast Popup Error đỏ lè trên UI. 
6. Sau cùng, `handleFirestoreError` **throw** lỗi đó ra.
7. Tại hàm `deleteDamageProtocol()` ban đầu, cấu trúc `try { ... } catch (err)` hứng lại lỗi này và chỉ âm thầm in ra thêm một log cảnh báo bằng thẻ `console.warn(...)`.

**Kết quả thực tế:**
Lập trình viên viết khối `try...catch` ở bên ngoài để muốn bọc lỗi không cho crash, nhưng quên mất rằng hàm wrapper `handleFirestoreError` ở phần lõi đã kịp thời "nháy" một `console.error`! Do cái console này bị ghi đè thành event trigger, popup lỗi đã "chạy lọt" qua ngay bên trong lớp DataService trước cả khi văng ra tới khối lệnh Catch bên ngoài.

## 4. Phân loại mức độ nghiêm trọng
Lỗi báo `"No document to update"` trong tình huống cụ thể này **KHÔNG NGHIÊM TRỌNG**.
Mục tiêu ban đầu của đoạn code là: dọn dẹp các bản nháp rác bên trong `vehicleInspectionForms` phòng hờ nó còn tồn tại đâu đó do kiến trúc cũ. Việc Không Tồn Tại là trạng thái hoàn toàn mong chờ, bình thường và hoàn thiện. Hoàn toàn không có dữ liệu nào bị kẹt lại. Hệ thống chỉ đang làm quá lố việc la hét (throw error và gọi Popup) cho một tiến trình dọn rác dĩ nhiên.

## 5. Đề xuất
*   Tránh để các lỗi hiển nhiên bị bắt bởi bộ Custom Error Handler toàn biên.
*   **Giải pháp trực tiếp:** Do ứng dụng đã hoàn thiện lại hệ thống Unified form và Soft Delete hiện hành, chỉ cần thiết phải xóa thuộc `damageProtocols` là đủ. Bạn có thể xóa bỏ hoàn toàn khối `try { await DataService.update('vehicleInspectionForms', ...) } catch (...)` ở phía `deleteDamageProtocol`. Đoạn mã này không còn mang lại lợi ích về đồng bộ dữ liệu mà chỉ gọi API không cần thiết, tiêu hao thêm request và gây giật mình trên Giao diện.
