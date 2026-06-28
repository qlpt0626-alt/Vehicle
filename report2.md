# Báo cáo Phân tích Dữ liệu Thùng rác & Lỗi Duplicate Key

## 1. Phân tích nguyên nhân gốc rễ lỗi Duplicate Key (React `key` prop)

Qua quá trình rà soát logic trong `src/components/TrashTab.tsx` và `src/services/dbService.ts` (hàm `getSystemTrash()`), vòng lặp render trên giao diện sử dụng key sau:
`key={`${item.type}-${item.id}`}`

Tuy nhiên, lỗi "Duplicate child key" xảy ra có nghĩa là hàm `getSystemTrash()` đã trả về ít nhất 2 phần tử có **cùng Type** và **cùng giá trị ID phân giải**. Cụ thể, các nguyên nhân/document gây ra lỗi nằm ở các trường hợp sau:

### Trường hợp 1: Dữ liệu VEHICLE (Hồ sơ xe)
Lỗi xảy ra khi có dữ liệu rác trong `localStorage` (ở các key `local_vehicles` hoặc `vehicles`) thiếu ID. 
- **Đoạn code gây lỗi:** 
  ```typescript
  // Trong dbService.ts hàm getSystemTrash()
  if (!storedVehicles.find(v => v.id === lv.id || v.vehicleId === lv.vehicleId)) {
      storedVehicles.push(lv); // Đẩy vào nếu không tìm thấy
  }
  ```
- **Phân tích:** Nếu một hoặc nhiều object `lv` lưu tạm không có trường `id` và `vehicleId` (bị undefined), hàm `find()` sẽ không khớp được với dữ liệu Firestore => Hệ thống liên tục PUSH các phần tử lỗi này vào mảng `storedVehicles`.
- **Kết quả key bị trùng:** Lúc map ra `trashItems`, `id` được tính là `v.vehicleId || v.id || v.plateNumber`. Nếu các mục này không có hoặc trùng biển số (plateNumber), chúng sẽ tạo ra nhiều key trùng lặp dạng: **`VEHICLE-undefined`** hoặc **`VEHICLE-[Biển_số_trùng]`**.

### Trường hợp 2: Dữ liệu INSPECTION_FORM (Biên bản kiểm chọn)
- **Đoạn code gây lỗi:**
  ```typescript
  id: f.id || f.docId || f.protocolId || f.vehicleId,
  ```
- **Phân tích:** Đối với bộ hồ sơ `vehicleInspectionForms`, khi được fallback ID trong Firebase, document ID thực tế thường bị ghi đè thành chính `vehicleId` (do logic ở `firebase.js` mapping docId).
- Nếu có sự cố mất dữ liệu gốc `doc.id` (ví dụ do lỗi đồng bộ LocalStorage trước đó), hàm map sẽ lấy fallback là `f.vehicleId`. Nếu một xe (cùng 1 `vehicleId`) có 2 phiên bản biên bản kiểm chọn bị xóa, cả hai sẽ đều nhận key phân giải là **`INSPECTION_FORM-[vehicleId]`** và bùng phát lỗi Duplicate Key.

### Trường hợp 3: Sự cố "Kép" trong LocalStorage + React StrictMode
Nếu trong LocalStorage chứa nhiều bản ghi rác có cấu trúc rỗng (isDeleted = true nhưng id = null), khi kết hợp với logic map lấy fallback, nó sẽ sản sinh hàng loạt key kết thúc bằng `-undefined` (ví dụ: `REPAIR_LOG-undefined` do thiếu `historyId`).

---

## 2. Giải pháp khắc phục nhanh
Để UI Thùng rác không bị sập do lỗi render React, KHÔNG nên tin tưởng tuyệt đối vào ID phân giải từ CSDL (nhất là dữ liệu rác đã xóa dễ bị rách/missing field).

**Cách fix (Gợi ý):**
Trong `TrashTab.tsx`, lót thêm UUID dự phòng hoặc sử dụng index, kết hợp:
```tsx
// Thêm chỉ mục an toàn nếu id bị undefined
<tr key={`${item.type}-${item.id || index}-${index}`} ...>
```
Hoặc cấu trúc lại hàm `getSystemTrash()` trong `dbService.ts` để chủ động sàng lọc (`filter`) và loại bỏ các document có cùng `type` và `id` trước khi trả về cho UI. Đã in kèm log `console.log` vào `TrashTab.tsx` như yêu cầu để người dùng có thể tự kiểm chứng Object rác trực tiếp từ Browser DevTools.
