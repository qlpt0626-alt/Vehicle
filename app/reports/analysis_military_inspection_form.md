# Phân tích MilitaryInspectionForm.tsx

## 1. Danh sách các state của component và trạng thái phục hồi

| Tên State | Load từ initialForm | Dùng để render UI | Giá trị mặc định |
| :--- | :---: | :---: | :--- |
| `zoom` | ❌ | ✅ | `100` |
| `isFullscreen` | ❌ | ✅ | `false` |
| `reportNo` | ✅ | ✅ | `''` |
| `docDate` | ✅ | ✅ | `''` |
| `repairLevel` | ✅ | ✅ | `'Sửa chữa vừa'` |
| `repairGroup` | ✅ | ✅ | `'Nhóm xe vận tải'` |
| `plateNumber` | ✅ | ✅ | `activeVehicle.plateNumber` hoặc `''` |
| `chassisNumber` | ✅ | ✅ | `activeVehicle.chassisNumber` hoặc `''` |
| `actualChassisNumber` | ✅ | ✅ | `activeVehicle.chassisNumber` hoặc `''` |
| `engineNumber` | ✅ | ✅ | `activeVehicle.engineNumber` hoặc `''` |
| `actualEngineNumber` | ✅ | ✅ | `activeVehicle.engineNumber` hoặc `''` |
| `giverUnit` | ✅ | ✅ | `activeVehicle.unit` hoặc `''` |
| `currentVehicleId` | ✅ (từ `vehicleId`) | ❌ | `activeVehicle.vehicleId` hoặc `''` |
| `vehicleName` | ✅ | ✅ | `activeVehicle.vehicleName` hoặc `'Hyundai County'` |
| `staticTechnicalStatus` | ✅ | ✅ | `''` |
| `dynamicTechnicalStatus` | ✅ | ✅ | `''` |
| `recommendation` | ✅ | ✅ | `''` |
| `customConclusion` | ✅ | ✅ | `''` |
| `availableVehicles` | ❌ | ❌ (chỉ dùng nội bộ) | `[]` |
| `formData` | ✅ | ✅ | `{}` |
| `existingForm` | ✅ | ❌ | `null` |
| `currentProtocolId` | ✅ | ❌ | `''` |
| `isSaving` | ❌ | ✅ | `false` |
| `isSuccessAlert` | ❌ | ✅ | `false` |
| `saveStatus` | ❌ | ✅ | `''` |
| `showRecoveryModal` | ❌ | ✅ | `false` |
| `recoveredData` | ❌ | ❌ (trung gian) | `null` |
| `isInitialized` | ❌ | ❌ | `false` |

## 2. Đặc biệt kiểm tra các field:

* **items:** KHÔNG PHẢI STATE. Nó được tính toán (compute) động từ `formData` và `HyundaiCountyTemplate` khi bấm Lưu (hàm `executeSave`). Nó map qua `formData` để biến thành mảng `dpItems`.
* **conclusion:** KHÔNG PHẢI STATE. Là chuỗi hardcoded được sinh ra lúc lưu: ``Nhất trí bàn giao xe ${vehicleName}...``. Trên UI, nội dung Kết luận người dùng nhập nằm ở state `customConclusion`.
* **technician:** KHÔNG PHẢI STATE. Không hiển thị trên UI. Khi lưu sẽ gắn cứng giá trị: `lastEditedBy || "Kỹ thuật viên kiểm tra"`.
* **driver:** KHÔNG PHẢI STATE. Không hiển thị trên UI. Khi lưu sẽ gắn cứng giá trị là: `"Lái xe bàn giao"`.
* **repairLevel:** LÀ STATE. Được load lại hoàn toàn qua `savedData.headerData.repairLevel`.
* **recommendation:** LÀ STATE. Được load lại hoàn toàn qua `savedData.headerData.recommendation`.

## 3. Xác định State hiển thị UI nhưng KHÔNG phục hồi được:
Tất cả các State ảnh hưởng tới dữ liệu nội dung (headerData, formData) ĐỀU ĐƯỢC PHỤC HỒI ĐẦY ĐỦ qua hàm `loadRecoveredForm` (từ dòng 230). 
Tuy nhiên, UI có các field không thuộc form (như zoom, fullscreen) sẽ reset về mặc định vì chúng chỉ là UI state.
Không có Data State nào trên MilitaryInspectionForm hiển thị lên UI mà bị bỏ xót phục hồi. Lỗi mất dữ liệu xảy ra khi document này được nạp bằng một component khác đọc không đúng chuẩn (DamageProtocolForm).
