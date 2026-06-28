import React from 'react';
import { Truck, Copy, CheckCircle2 } from 'lucide-react';
import { Vehicle } from '../types';
import { formatVNTime } from '../utils/time';

interface VehicleProfileCardProps {
  vehicle: Vehicle;
}

export const VehicleProfileCard: React.FC<VehicleProfileCardProps> = ({ vehicle }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fields = [
    { label: 'Số đăng ký (Biển số)', value: vehicle.plateNumber, key: 'plateNumber', mono: true },
    { label: 'Nhãn hiệu xe', value: vehicle.brand, key: 'brand' },
    { label: 'Loại phương tiện', value: vehicle.vehicleType, key: 'vehicleType' },
    { label: 'Phân nhóm xe', value: vehicle.vehicleGroup, key: 'vehicleGroup' },
    { label: 'Số khung (Chassis)', value: vehicle.chassisNumber, key: 'chassisNumber', mono: true },
    { label: 'Số máy (Engine No)', value: vehicle.engineNumber, key: 'engineNumber', mono: true },
  ];

  if ((vehicle as any).unit) {
    fields.push({ label: 'Đơn vị', value: (vehicle as any).unit, key: 'unit', mono: false });
  }

  return (
    <div id={`vehicle-card-${vehicle.vehicleId}`} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden h-full">
      {/* Mini military ribbon accent */}
      <div className="h-2 bg-gradient-to-r from-emerald-800 via-yellow-600 to-emerald-950"></div>
      
      <div className="p-6">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4 mb-5">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider font-sans">HỒ SƠ XE SỬA CHỮA</span>
            <h3 className="text-lg md:text-xl font-bold font-sans text-stone-900 leading-tight">
              {vehicle.brand || "Phương tiện kỹ thuật"}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.key} className="bg-stone-50 border border-stone-200 p-3 rounded-xl relative group">
              <span className="block text-xs text-stone-500 font-medium mb-1">{field.label}</span>
              <div className="flex items-center justify-between">
                <span className={`text-stone-900 font-semibold ${field.mono ? 'font-mono text-sm tracking-wide bg-stone-100/50 px-1.5 py-0.5 rounded border border-stone-200/50' : 'text-base font-sans'}`}>
                  {field.value || 'N/A'}
                </span>
                
                {field.value && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(field.value, field.key)}
                    className="text-stone-400 hover:text-emerald-700 p-1 rounded-md transition-colors cursor-pointer"
                    title="Sao chép thông tin"
                  >
                    {copiedField === field.key ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Creator and updater metadata section */}
        <div className="mt-6 pt-5 border-t border-stone-150 grid grid-cols-2 gap-3 md:grid-cols-5 text-xs text-stone-500">
          <div className="flex flex-col">
            <span className="text-[11px] text-stone-400 font-sans uppercase font-medium tracking-wider">Người tạo:</span>
            <strong className="text-stone-850 font-sans text-sm font-bold mt-1 text-emerald-950">{(vehicle as any).createdByName || "Nguyễn Văn A"}</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-stone-400 font-sans uppercase font-medium tracking-wider">Đơn vị:</span>
            <strong className="text-stone-850 font-sans text-sm font-bold mt-1 text-stone-800">{(vehicle as any).createdByUnit || "Tiểu đoàn 30"}</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-stone-400 font-sans uppercase font-medium tracking-wider">Ngày tạo:</span>
            <strong className="text-stone-850 font-sans text-sm font-bold mt-1 text-stone-800">
              {formatVNTime((vehicle as any).createdAt) || "Chưa rõ"}
            </strong>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-stone-400 font-sans uppercase font-medium tracking-wider">Người sửa cuối:</span>
            <strong className="text-stone-850 font-sans text-sm font-bold mt-1 text-emerald-900">{(vehicle as any).updatedByName || "Trần Văn B"}</strong>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-stone-400 font-sans uppercase font-medium tracking-wider">Ngày sửa cuối:</span>
            <strong className="text-stone-850 font-sans text-sm font-bold mt-1 text-stone-800">
              {formatVNTime((vehicle as any).updatedAt) || "Chưa rõ"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
