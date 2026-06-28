import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Printer, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';
import { Vehicle, DamageProtocol, DamageItem } from '../types';
import { logger } from '../utils/logger';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface DamageProtocolFormProps {
  vehicle: Vehicle | null;
  onCancel: () => void;
  onSave: (protocol: Omit<DamageProtocol, 'protocolId' | 'createdAt'>) => Promise<void>;
  initialProtocol?: DamageProtocol | null;
}

export const DamageProtocolForm: React.FC<DamageProtocolFormProps> = ({ 
  vehicle, 
  onCancel, 
  onSave,
  initialProtocol = null
}) => {
  // Form general state
  const [reportNumber, setReportNumber] = useState(initialProtocol?.reportNumber || '03/BB-SCTH30');
  const [createdDate, setCreatedDate] = useState(initialProtocol?.createdDate || new Date().toISOString().split('T')[0]);
  const [place, setPlace] = useState(initialProtocol?.place || 'Xưởng Sửa chữa Tổng hợp, Tiểu đoàn SCTH30');
  
  // Council and representatives
  const [representativeGeneral, setRepresentativeGeneral] = useState(initialProtocol?.representativeGeneral || 'Trung tá Lê Hồng Nam - Tiểu đoàn trưởng');
  const [representativeTechnical, setRepresentativeTechnical] = useState(initialProtocol?.representativeTechnical || 'Đại úy Đỗ Văn Minh - Trưởng ban Kỹ thuật');
  const [technician, setTechnician] = useState(initialProtocol?.technician || 'Thượng úy Trần Quốc Tuấn - Trưởng tổ kỹ thuật');
  const [driver, setDriver] = useState(
    initialProtocol?.driver || 
    (vehicle ? `Hạ sĩ Nguyễn Văn Hùng - Lái xe ${vehicle.brand}` : 'Hạ sĩ Nguyễn Văn Hùng - Lái xe')
  );
  
  // Vehicle Spec States
  const [plateNumber, setPlateNumber] = useState(initialProtocol?.plateNumber || vehicle?.plateNumber || '');
  const [brand, setBrand] = useState(initialProtocol?.brand || vehicle?.brand || '');
  const [vehicleType, setVehicleType] = useState(initialProtocol?.vehicleType || vehicle?.vehicleType || '');
  const [chassisNumber, setChassisNumber] = useState(initialProtocol?.chassisNumber || vehicle?.chassisNumber || '');
  const [engineNumber, setEngineNumber] = useState(initialProtocol?.engineNumber || vehicle?.engineNumber || '');
  const [odometer, setOdometer] = useState(initialProtocol?.odometer || '15,400 km');

  // Dynamic Item List State
  const [items, setItems] = useState<DamageItem[]>(
    initialProtocol?.items || [
      {
        id: "item-1",
        itemName: "Động cơ xe - Pít tông, xéc măng",
        damageDetail: "Pít tông số 3 cào xước vỏ lốc xi-lanh, xéc măng bị nứt gãy cơ học, tiếng gõ cò súp áp kêu to dội hầm máy",
        solution: "Đề nghị thay thế mới bộ pít tông + xéc măng tiêu chuẩn, xoáy lại xu-páp nạp thải cốt 1"
      },
      {
        id: "item-2",
        itemName: "Hệ thống điện - Bộ chia điện phụ",
        damageDetail: "Tiếp điểm má vít bị rỗ mòn đánh điện chập chờn, cuộn đánh lửa có điện áp tản mạn yếu",
        solution: "Đề nghị tháo kiểm tra gờ mút bôi trơn lại trục chia điện, thay mới má vít thứ cấp"
      }
    ]
  );

  // General conclusion
  const [conclusion, setConclusion] = useState(
    initialProtocol?.conclusion ||
    "Hội đồng kiểm tra kỹ thuật lập biên bản thống nhất xác nhận tình trạng hư hỏng của phương tiện nêu trên. Kiến nghị đưa xe vào kế hoạch sửa chữa vừa của Tiểu đoàn SCTH30 theo đúng cấp độ hư hỏng thực tế. Xin cấp phát đồng bộ vật tư thay thế."
  );

  // Flow controllers
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(!!initialProtocol);

  const [zoom, setZoom] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 800) {
      return Math.max(30, Math.floor((window.innerWidth) / 7.94));
    }
    return 100;
  });

  // Dynamic Row Operations
  const handleAddItem = () => {
    const newItemId = 'item-' + Math.random().toString(36).substring(2, 9);
    setItems(prev => [
      ...prev,
      {
        id: newItemId,
        itemName: '',
        damageDetail: '',
        solution: ''
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      logger.warn("Dữ liệu chưa đầy đủ.");
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof Omit<DamageItem, 'id'>, value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // Validation
    if (!reportNumber.trim()) {
      setSaveError("Mã/Số hiệu biên bản không được bỏ trống.");
      return;
    }
    if (!plateNumber.trim()) {
      setSaveError("Biển số đăng ký phương tiện không được bỏ trống.");
      return;
    }
    if (items.some(item => !item.itemName.trim() || !item.damageDetail.trim())) {
      setSaveError("Tất cả các dòng danh mục hư hỏng phải điền đầy đủ thông tin tên và hiện trạng cụ thể.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Omit<DamageProtocol, 'protocolId' | 'createdAt'> = {
        vehicleId: vehicle?.vehicleId || plateNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
        reportNumber,
        createdDate,
        place,
        representativeGeneral,
        representativeTechnical,
        technician,
        driver,
        plateNumber,
        brand,
        vehicleType,
        chassisNumber,
        engineNumber,
        odometer,
        items,
        conclusion
      };

      await onSave(payload);
    } catch (err: any) {
      console.error(err);
      setSaveError(err.message || "Gặp lỗi trong lúc lưu hồ sơ chi tiết. Hãy thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
      {/* Header Accent Bar */}
      <div className="h-1 bg-emerald-500 w-full" />
      
      {/* Inner Controls Toolbar */}
      <div className="px-5 py-3 border-b border-stone-800 bg-stone-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
           <FileText className="h-5 w-5 text-emerald-500" />
           <h3 className="font-bold text-stone-100 text-sm md:text-base font-sans uppercase">
             BIÊN BẢN CHI TIẾT HƯ HỎNG {isSaving ? "(Đang lưu...)" : ""}
           </h3>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg overflow-hidden md:mt-0 shadow-inner mr-2">
            <button type="button" onClick={() => setZoom(Math.max(30, zoom - 10))} className="px-3 py-1.5 hover:bg-stone-800 text-stone-300 transition-colors font-bold text-sm">-</button>
            <div className="px-3 py-1.5 text-stone-300 font-mono text-sm border-x border-stone-800 min-w-[3rem] text-center">{zoom}%</div>
            <button type="button" onClick={() => setZoom(Math.min(200, zoom + 10))} className="px-3 py-1.5 hover:bg-stone-800 text-stone-300 transition-colors font-bold text-sm">+</button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">In Biên Bản</span>
          </button>

          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-stone-800 text-stone-300 hover:text-white rounded-lg cursor-pointer transition-colors"
            title="Đóng biên bản"
          >
            <X className="h-4.5 w-4.5" />
          </button>
          
          <button
            onClick={handleFormSubmit}
            disabled={isSaving}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ml-1"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lưu</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-stone-950/80 p-2 sm:p-6 flex justify-center items-start">
        <div 
          className="bg-white text-stone-900 shadow-2xl origin-top-left sm:origin-top border-2 border-stone-950 print:border-none print:w-full print:p-0 print:shadow-none print:!zoom-100"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            zoom: `${zoom}%`,
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            marginRight: 'auto',
            marginLeft: 'auto'
          }}
          id="damage-a4-document"
        >
          <div className="w-full text-black leading-normal text-sm space-y-8 print:p-0">
            
            {/* National Header & Unit */}
            <div className="grid grid-cols-2 gap-4 items-start text-center">
              <div>
                <span className="font-bold uppercase block text-xs md:text-sm">BỘ QUỐC PHÒNG</span>
                <span className="font-bold uppercase block text-xs md:text-sm tracking-wide">QUÂN ĐOÀN 34 - CỤC HẬU CẦN KỸ THUẬT</span>
                <span className="font-bold uppercase block text-xs text-stone-800">TIỂU ĐOÀN SCTH30</span>
                <div className="flex justify-center my-1.5">
                  <span className="border-t border-black w-24 block"></span>
                </div>
                <span className="text-[11px] font-sans block mt-1">Số: <strong className="underline font-serif">{reportNumber}</strong>/BB-SCTH30</span>
              </div>
              
              <div>
                <span className="font-bold uppercase block text-xs md:text-sm">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                <span className="font-bold block text-xs md:text-sm">Độc lập - Tự do - Hạnh phúc</span>
                <div className="flex justify-center my-1.5">
                  <span className="border-t border-black w-36 block"></span>
                </div>
                <span className="italic block text-xs">Địa danh, ngày {createdDate.split('-')[2]} tháng {createdDate.split('-')[1]} năm {createdDate.split('-')[0]}</span>
              </div>
            </div>

            {/* Title Document */}
            <div className="text-center space-y-2 pt-4">
              <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide">BIÊN BẢN CHI TIẾT HƯ HỎNG</h2>
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider">(V/v: Giám định chi tiết hư hỏng phương tiện kỹ thuật)</h3>
            </div>

            {/* Time and Representatives details */}
            <div className="space-y-2 mt-4 text-xs md:text-sm">
              <p>
                Hôm nay, ngày {createdDate.split('-')[2]} tháng {createdDate.split('-')[1]} năm {createdDate.split('-')[0]}, tại địa điểm: <strong className="border-b border-black md:px-2">{place}</strong>
              </p>
              <p className="font-bold italic">Chúng tôi gồm Hội đồng Giám định kỹ thuật gồm có:</p>
              <ul className="list-none pl-4 space-y-1.5">
                <li>1. Đồng chí: <strong className="border-b border-black px-2">{representativeGeneral}</strong></li>
                <li>2. Đồng chí: <strong className="border-b border-black px-2">{representativeTechnical}</strong></li>
                <li>3. Đồng chí: <strong className="border-b border-black px-2">{technician}</strong></li>
                <li>4. Đồng chí: <strong className="border-b border-black px-2">{driver}</strong> (Lái xe, trưởng xe chịu trách nhiệm bảo lưu xe)</li>
              </ul>
            </div>

            {/* Vehicle Profile Info */}
            <div className="space-y-3.5 mt-4">
              <p className="font-bold uppercase text-xs md:text-sm tracking-wide">I. THÔNG TIN PHƯƠNG TIỆN ĐỐI CHIẾU DANH BẢN:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs md:text-sm pl-4">
                <div>- Biển số đăng ký quân sự: <strong className="font-mono underline text-stone-900">{plateNumber}</strong></div>
                <div>- Nhãn hiệu phương tiện: <strong className="underline text-stone-900">{brand}</strong></div>
                <div>- Số khung (Chassis): <strong className="font-mono text-stone-900">{chassisNumber}</strong></div>
                <div>- Số máy (Engine): <strong className="font-mono text-stone-900">{engineNumber}</strong></div>
                <div>- Loại phương tiện: <strong className="underline text-stone-900">{vehicleType}</strong></div>
                <div>- Số Km đã chạy thực tế (Odometer): <strong className="underline text-stone-900">{odometer}</strong></div>
              </div>
            </div>

            {/* Technical Detail list of damages TABLE */}
            <div className="space-y-2">
              <p className="font-bold uppercase text-xs md:text-sm tracking-wide">II. DANH MỤC CỤ TRẰNG CHI TIẾT HƯ HỎNG VÀ ĐỀ XUẤT:</p>
              <table className="w-full border-collapse border border-black text-left text-xs md:text-sm">
                <thead>
                  <tr className="bg-stone-50 text-center">
                    <th className="border border-black p-2 font-bold w-12">STT</th>
                    <th className="border border-black p-2 font-bold w-1/4">Tên cụm, chi tiết hư hỏng</th>
                    <th className="border border-black p-2 font-bold w-2/5">Hiện trạng cụ thể hư hại kỹ thuật</th>
                    <th className="border border-black p-2 font-bold">Biện pháp khắc phục kiến nghị</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border border-black p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-black p-2 font-bold">{item.itemName}</td>
                      <td className="border border-black p-2 whitespace-pre-wrap">{item.damageDetail}</td>
                      <td className="border border-black p-2 italic">{item.solution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Council Conclusion */}
            <div className="space-y-2">
              <p className="font-bold uppercase text-xs md:text-sm tracking-wide">III. KẾT LUẬN CHUNG CỦA HỘI ĐỒNG GIÁM ĐỊNH:</p>
              <p className="pl-4 italic leading-relaxed text-justify text-xs md:text-sm border-l-2 border-stone-850 bg-stone-50/50 p-2.5 rounded">
                "{conclusion}"
              </p>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs md:text-sm">
              <div>
                <span className="font-bold uppercase block">LÁI XE / TRƯỞNG XE</span>
                <span className="text-[11px] italic text-stone-600 block">(Ký, ghi rõ họ tên)</span>
                <div className="h-20"></div>
                <span className="font-bold underline block">{driver.includes('-') ? driver.split('-')[0].trim() : driver}</span>
              </div>
              
              <div>
                <span className="font-bold uppercase block">THỢ SỬA PHỤ TRÁCH</span>
                <span className="text-[11px] italic text-stone-600 block">(Ký, ghi rõ họ tên)</span>
                <div className="h-20"></div>
                <span className="font-bold underline block">{technician.includes('-') ? technician.split('-')[0].trim() : technician}</span>
              </div>

              <div>
                <span className="font-bold uppercase block">ĐẠI DIỆN HỘI ĐỒNG</span>
                <span className="text-[11px] italic text-stone-600 block">(Ký, đóng dấu chỉ huy)</span>
                <div className="h-20"></div>
                <span className="font-bold underline block">{representativeGeneral.includes('-') ? representativeGeneral.split('-')[0].trim() : representativeGeneral}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
