# Phân tích DamageProtocolForm.tsx

## 1. Nguồn gốc cấp dữ liệu hiển thị (từ initialProtocol)

`DamageProtocolForm` đọc dữ liệu TỪ CÁC FIELD Ở ROOT của object `initialProtocol` chứ không đọc từ bên trong `headerData` hay `formData`.

Cụ thể:
* `reportNumber`: Đọc từ `initialProtocol.reportNumber`
* `createdDate`: Đọc từ `initialProtocol.createdDate`
* `place`: Đọc từ `initialProtocol.place`
* `representativeGeneral`: Đọc từ `initialProtocol.representativeGeneral`
* `representativeTechnical`: Đọc từ `initialProtocol.representativeTechnical`
* `technician`: Đọc từ `initialProtocol.technician`
* `driver`: Đọc từ `initialProtocol.driver`
* `items`: Đọc từ `initialProtocol.items` (là một mảng)
* `conclusion`: Đọc từ `initialProtocol.conclusion`

## 2. Kiểm tra các field hiển thị bằng giá trị Hardcode

Khi `initialProtocol` truyền vào không chứa các field ở vị trí root, một loạt các giá trị hardcode sẽ xuất hiện trên UI của Component này:

* **Lái xe bàn giao:** Nếu thiếu `driver`, sẽ rới vào hardcode `Hạ sĩ Nguyễn Văn Hùng - Lái xe...`
* **Đại diện kỹ thuật:** Nếu thiếu `representativeTechnical`, sẽ rơi vào `Đại úy Đỗ Văn Minh - Trưởng ban Kỹ thuật`
* **Trạm sửa chữa H30 / nơi sửa:** Nếu thiếu `place`, rơi vào `Xưởng Sửa chữa Tổng hợp, Tiểu đoàn SCTH30`
* **Đại diện chỉ huy:** Nếu thiếu `representativeGeneral`, rơi vào `Trung tá Lê Hồng Nam...`
* **Kỹ thuật viên:** Nếu thiếu `technician`, rơi vào `Thượng úy Trần Quốc Tuấn - Trưởng tổ kỹ thuật`

## 3. So sánh Payload (Military vs Damage)

**Military Inspection Form LƯU (ghi):**
1. Ghi field root `items` dạng mảng động (sinh từ `formData`).
2. Ghi field root `conclusion` là text ghép mặc định.
3. Ghi cục bộ `headerData` chứa các text nhập.
4. Ghi cục bộ `formData` chứa danh sách check list.
5. Ghi các field root khác (`place`, `driver`, `technician`...) bằng **giá trị tĩnh cứng (hardcode tĩnh)** lúc save.

**Damage Protocol Form ĐỌC (đọc preview):**
1. CHỈ ĐỌC ở cấp root (`initialProtocol.X`).
2. Tức là đọc trúng giá trị tĩnh (`place="Tiểu đoàn SCTH30"`, `driver="Lái xe bàn giao"`) từ cái Payload được lưu bởi Military.
3. KHÔNG ĐỌC `headerData` (chứa input người dùng ghi).

## 4. Liệt kê các Field có trong DamageProtocolForm nhưng KHÔNG đọc từ Payload (bị sai lệch)

Dựa trên cấu trúc lưu của `MilitaryInspectionForm`, các cột sau bị đọc sai do khác chuẩn Data Schema:

* `representativeGeneral`: Bên Military lưu là `"Đơn vị bàn giao: {giverUnit}"`, Damage form đè lên và hiển thị nếu sai format, nhưng vẫn lấy được root string.
* Dữ liệu chi tiết Kỹ thuật tĩnh / Kỹ thuật hoạt động / Đề nghị / Kết luận chỉnh tay (của Military form nằm trong `headerData`) **hoàn toàn không được hiển thị** lên trang preview của DamageProtocolForm.
* Các text trạng thái hạng mục nằm trong mảng `items` thì may mắn được DamageProtocolForm hiển thị đúng vì nó đọc thẳng `initialProtocol.items`.
