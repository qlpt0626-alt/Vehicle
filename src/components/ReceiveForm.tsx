import React, { useState, useEffect } from 'react';
import { 
  FilePlus2, 
  Save, 
  Loader2, 
  AlertTriangle,
  FileText,
  Calendar,
  Contact,
  Wrench
} from 'lucide-react';
import { 
  Vehicle, 
  TECHNICAL_SECTIONS_LABEL, 
  TechnicalSections, 
  TechnicalStatus 
} from '../types';

interface ReceiveFormProps {
  initialPlate?: string;
  existingVehicle: Vehicle | null;
  onSaveSuccess: (plate: string) => void;
  onCancel: () => void;
  saveLogFn: (
    vehicle: Omit<Vehicle, 'vehicleId'>,
    history: any
  ) => Promise<any>;
}

export const ReceiveForm: React.FC<ReceiveFormProps> = ({
  initialPlate = '',
  existingVehicle,
  onSaveSuccess,
  onCancel,
  saveLogFn
}) => {
  // Common Protocol Details
  const [reportNumber, setReportNumber] = useState(`BB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [receiveDate, setReceiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [giver, setGiver] = useState('');
  const [receiver, setReceiver] = useState('');

  // Vehicle Profile Details
  const [plateNumber, setPlateNumber] = useState(() => existingVehicle?.plateNumber || initialPlate || localStorage.getItem('temp_plateNumber') || '');
  const [brand, setBrand] = useState(() => existingVehicle?.brand || localStorage.getItem('temp_vktbktName') || '');
  const [vehicleType, setVehicleType] = useState(existingVehicle?.vehicleType || '');
  const [vehicleGroup, setVehicleGroup] = useState(existingVehicle?.vehicleGroup || 'Xe vận tải quân sự');
  const [chassisNumber, setChassisNumber] = useState(() => existingVehicle?.chassisNumber || localStorage.getItem('temp_chassisNumber') || localStorage.getItem('temp_actualChassisNumber') || '');
  const [engineNumber, setEngineNumber] = useState(() => existingVehicle?.engineNumber || localStorage.getItem('temp_engineNumber') || localStorage.getItem('temp_actualEngineNumber') || '');

  // 9 Technical Sections
  const [technicalState, setTechnicalState] = useState<TechnicalSections>({
    engineStatus: 'Tốt',
    electricalStatus: 'Tốt',
    chassisStatus: 'Tốt',
    bodyStatus: 'Tốt',
    cushionStatus: 'Tốt',
    tireBatteryStatus: 'Tốt',
    specialEquipmentStatus: 'Tốt',
    accessoryStatus: 'Tốt',
    paintStatus: 'Tốt'
  });

  // Comments & Saving state
  const [note, setNote] = useState('');
  const [unitComment, setUnitComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state if existingVehicle is updated
  useEffect(() => {
    if (existingVehicle) {
      setPlateNumber(existingVehicle.plateNumber);
      setBrand(existingVehicle.brand);
      setVehicleType(existingVehicle.vehicleType);
      setVehicleGroup(existingVehicle.vehicleGroup);
      setChassisNumber(existingVehicle.chassisNumber);
      setEngineNumber(existingVehicle.engineNumber);
    }
  }, [existingVehicle]);

  const handleStatusChange = (section: keyof TechnicalSections, value: string) => {
    setTechnicalState(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // Validate inputs
    if (!plateNumber.trim()) {
      setSaveError("Biển số xe / Số đăng lý không được để trống!");
      return;
    }
    if (!brand.trim()) {
      setSaveError("Nhãn hiệu xe không được để trống!");
      return;
    }
    if (!giver.trim()) {
      setSaveError("Trưởng xe / Người bàn giao không được để trống!");
      return;
    }
    if (!receiver.trim()) {
      setSaveError("Người tiếp nhận không được để trống!");
      return;
    }

    try {
      setIsSaving(true);
      
      const vehiclePayload = {
        plateNumber: plateNumber.trim(),
        brand: brand.trim(),
        vehicleType: vehicleType.trim(),
        vehicleGroup: vehicleGroup,
        chassisNumber: chassisNumber.trim(),
        engineNumber: engineNumber.trim()
      };

      const historyPayload = {
        reportNumber: reportNumber.trim(),
        receiveDate: receiveDate,
        giver: giver.trim(),
        receiver: receiver.trim(),
        ...technicalState,
        note: note.trim(),
        unitComment: unitComment.trim()
      };

      // Save to localStorage temporary data
      localStorage.setItem('temp_plateNumber', plateNumber.trim());
      localStorage.setItem('temp_vktbktName', brand.trim());
      localStorage.setItem('temp_chassisNumber', chassisNumber.trim());
      localStorage.setItem('temp_actualChassisNumber', chassisNumber.trim());
      localStorage.setItem('temp_engineNumber', engineNumber.trim());
      localStorage.setItem('temp_actualEngineNumber', engineNumber.trim());

      await saveLogFn(vehiclePayload, historyPayload);
      onSaveSuccess(plateNumber);
    } catch (err: any) {
      console.error("Save failure:", err);
      setSaveError(err.message || "Đã xảy ra sự cố đột ngột khi lưu dữ liệu. Vui lòng kiểm tra các khoá trường.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="receive-form-container" className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden mb-6 animate-fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-stone-850 to-emerald-950 p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-800 rounded-lg text-emerald-100">
            <FilePlus2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-sans tracking-tight">Biên Bản Giao Nhận Xe Sửa Chữa</h2>
            <p className="text-emerald-100/70 text-xs mt-0.5">Tiếp nhận lý trình trạng thái cơ học, lỗi phát sinh của phương tiện.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 px-3 border border-emerald-700 hover:bg-emerald-800 rounded-lg text-xs font-semibold text-emerald-200 uppercase transition-colors cursor-pointer"
        >
          Đóng lại
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
        
        {/* Section 1: General Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <FileText className="h-4.5 w-4.5 text-emerald-850" />
            <span className="font-bold font-sans text-sm text-stone-800 uppercase tracking-widest">
              Thông Tin Chung & Sĩ Quan Bàn Giao
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Số biên bản giao nhận</label>
              <input
                id="doc-report-number"
                type="text"
                value={reportNumber}
                onChange={(e) => setReportNumber(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Ngày tiếp nhận</label>
              <input
                id="doc-receive-date"
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Người bàn giao (Họ tên, Cấp bậc)</label>
              <input
                id="doc-giver"
                type="text"
                placeholder="ví dụ: THUẬN VĂN AN (Đại uý)..."
                value={giver}
                onChange={(e) => setGiver(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Người tiếp nhận</label>
              <input
                id="doc-receiver"
                type="text"
                placeholder="ví dụ: ĐỖ MINH LONG (Kỹ thuật viên)..."
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-sans"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Vehicle profiles */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <Calendar className="h-4.5 w-4.5 text-emerald-850" />
            <span className="font-bold font-sans text-sm text-stone-800 uppercase tracking-widest">
              Lý Lịch & Định Danh Phương Tiện {existingVehicle && <span className="text-emerald-700 text-xs font-bold lowercase bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">( Khớp hồ sơ nền - Có thể cập nhật )</span>}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Số đăng ký (Biển số)</label>
              <input
                id="doc-plate"
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-mono uppercase font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Nhãn hiệu xe</label>
              <input
                id="doc-brand"
                type="text"
                placeholder="ví dụ: Ural-4320, KamAZ..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Loại xe</label>
              <input
                id="doc-type"
                type="text"
                placeholder="ví dụ: Xe thiết giáp, Xe tải việt dã..."
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Nhóm xe phân loại</label>
              <select
                id="doc-group"
                value={vehicleGroup}
                onChange={(e) => setVehicleGroup(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-sans"
              >
                <option value="Xe vận tải quân sự">Xe vận tải quân sự</option>
                <option value="Xe đặc chủng chuyên dụng">Xe đặc chủng chuyên dụng</option>
                <option value="Xe con quân sự">Xe con quân sự</option>
                <option value="Xe chiến đấu chuyên chiếc">Xe chiến đấu chuyên chiếc</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1 font-mono">Số khung (Chassis ID)</label>
              <input
                id="doc-chassis"
                type="text"
                placeholder="chữ số và chữ cái viết hoa"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1 font-mono">Số máy (Engine ID)</label>
              <input
                id="doc-engine-no"
                type="text"
                placeholder="ký số động cơ"
                value={engineNumber}
                onChange={(e) => setEngineNumber(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-2.5 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Technical evaluations input blocks as plain text fields */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <Wrench className="h-4.5 w-4.5 text-emerald-850" />
            <span className="font-bold font-sans text-sm text-stone-800 uppercase tracking-widest">
              Đánh Giá Chi Tiết Hệ Thống Kỹ Thuật Cơ Học (Nhập bằng văn bản)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(TECHNICAL_SECTIONS_LABEL).map((sectKey) => {
              const systemLabel = TECHNICAL_SECTIONS_LABEL[sectKey as keyof TechnicalSections];
              const value = technicalState[sectKey as keyof TechnicalSections];

              return (
                <div key={sectKey} className="flex flex-col">
                  <label className="text-xs font-semibold text-stone-600 mb-1">{systemLabel}</label>
                  <input
                    id={`input-${sectKey}`}
                    type="text"
                    value={value}
                    onChange={(e) => handleStatusChange(sectKey as keyof TechnicalSections, e.target.value)}
                    placeholder="Nhập tình trạng chi tiết (ví dụ: gạt nước hỏng, bít tông mòn...)"
                    className="w-full bg-stone-50 border border-stone-350 p-2.5 rounded-lg text-sm text-stone-850 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-sans transition-all"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Notes and Unit Remarks only (AI diagnostics removed) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <Contact className="h-4.5 w-4.5 text-emerald-850" />
            <span className="font-bold font-sans text-sm text-stone-800 uppercase tracking-widest">
              Ghi Chú Kỹ Thuật & Nhận Xét Của Đơn Vị
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-stone-600 mb-1">Ghi chú sự cố, hư hỏng thực tế của xe</label>
              <textarea
                id="doc-note"
                rows={8}
                placeholder="Nhập chi tiết các lỗi phát sinh thực tế khi kiểm nghiệm xe..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-3 rounded-lg text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-sans leading-relaxed resize-none"
              />
            </div>

            <div className="flex flex-col">
              <label className="block text-xs font-semibold text-stone-600 mb-1">Nhận xét của Đơn vị / Đề xuất điều phối kỹ thuật</label>
              <textarea
                id="doc-comment"
                rows={8}
                placeholder="Ý kiến chỉ đạo chỉ huy, đề nghị sửa chữa của Đơn vị hoặc ý kiến Trưởng xe..."
                value={unitComment}
                onChange={(e) => setUnitComment(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 p-3 rounded-lg text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white font-sans leading-relaxed resize-none"
              />
            </div>
          </div>
        </div>

        {/* Action controls */}
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold font-sans flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
          <button
            id="form-cancel-btn"
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-stone-300 hover:bg-stone-50 font-medium text-stone-700 rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
          >
            Huỷ bỏ
          </button>
          
          <button
            id="form-save-btn"
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-wait transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang lưu dữ liệu...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Lưu biên bản</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
