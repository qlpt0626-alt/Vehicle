import React, { useState, useEffect } from "react";
import { X, Save, FileText, Download, Loader2, CheckCircle, Printer } from "lucide-react";
import { Vehicle } from "../types";
import { dbService } from "../services/dbService";
import { jsPDF } from "jspdf";
import { logger } from "../utils/logger";

interface TemplateDamageProtocolProps {
  vehicle: Vehicle;
  onClose: () => void;
}

interface TemplateInfo {
  fileName: string;
  title: string;
  variables: string[];
  markdown: string;
}

export const TemplateDamageProtocol: React.FC<TemplateDamageProtocolProps> = ({
  vehicle,
  onClose
}) => {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [exportingWord, setExportingWord] = useState<boolean>(false);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  // 1. Fetch templates and saved data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load template files from backend
        const res = await fetch("/api/templates");
        if (!res.ok) throw new Error("Could not load templates");
        const list: TemplateInfo[] = await res.json();
        setTemplates(list);

        // Load previously saved template form values for this vehicle
        const saved = await dbService.getTemplateFormData(vehicle.vehicleId);
        if (saved) {
          setSelectedTemplateName(saved.templateName);
          setFormValues(saved.formValues);
        } else if (list.length > 0) {
          // If no previous data, set default template based on vehicle brand if matches
          const brandLower = (vehicle.brand || "").toLowerCase();
          let matched = list[0].fileName;
          if (brandLower.includes("gaz")) matched = "GAZ66.docx";
          else if (brandLower.includes("ural")) matched = "Ural4320.docx";
          else if (brandLower.includes("zil")) matched = "Zil131.docx";
          else if (brandLower.includes("kamaz")) matched = "Kamaz.docx";
          
          setSelectedTemplateName(matched);
        }
      } catch (err) {
        console.error("Error loading template damage protocols:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [vehicle.vehicleId, vehicle.brand]);

  // 2. Handle template selection change and populate/auto-fill variables
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedTemplateName(name);
    
    // Auto fill fields for chosen template
    if (name) {
      const selected = templates.find(t => t.fileName === name);
      if (selected) {
        const newValues: Record<string, string> = { ...formValues };
        
        selected.variables.forEach(v => {
          // Only auto-fill if the value is empty or hasn't been modified
          if (!newValues[v]) {
            newValues[v] = getAutoFillValue(v);
          }
        });
        setFormValues(newValues);
      }
    }
  };

  // 3. Helper for auto-filling variables based on selected vehicle
  const getAutoFillValue = (varName: string): string => {
    const vn = varName.toLowerCase();
    if (vn.includes("vehiclename") || vn.includes("brand")) return vehicle.brand || "";
    if (vn.includes("plate") || vn.includes("bien")) return vehicle.plateNumber || "";
    if (vn.includes("chassis") || vn.includes("khung")) return vehicle.chassisNumber || "";
    if (vn.includes("engine") || vn.includes("may")) return vehicle.engineNumber || "";
    if (vn.includes("unit") || vn.includes("donvi")) return "TIỂU ĐOÀN SCTH30 - CỤC HẬU CẦN-KỸ THUẬT QUÂN ĐOÀN 34";
    if (vn.includes("createddate") || vn.includes("checktime") || vn.includes("ngay")) {
      return new Date().toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    }
    if (vn.includes("repairshop") || vn.includes("location")) {
      return "Tiểu đoàn SCTH30, Cục Hậu cần-Kỹ thuật Quân đoàn 34";
    }
    return "";
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const selectedTemplate = templates.find(t => t.fileName === selectedTemplateName);

  // 4. Save formValues into Firestore
  const handleSave = async () => {
    if (!selectedTemplateName) return;
    try {
      setSaving(true);
      await dbService.saveTemplateFormData(vehicle.vehicleId, selectedTemplateName, formValues);
      setSaveSuccess(true);
      logger.success("Đã lưu biên bản.");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save error:", err);
      logger.error("Không thể lưu dữ liệu.", err);
    } finally {
      setSaving(false);
    }
  };

  // Convert Vietnamese accented string to non-accented (safeguard for jsPDF default fonts)
  const stripVietnameseAccents = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  // Helper to replace matched variables in lines for readable printing or pdf drawing
  const getReplacedTemplateLines = (): string[] => {
    if (!selectedTemplate) return [];
    const lines = selectedTemplate.markdown.split("\n");
    return lines.map(line => {
      let replaced = line;
      selectedTemplate.variables.forEach(v => {
        const val = formValues[v] || `[Chưa điền]`;
        const searchPattern = new RegExp(`\\{\\{\\s*${v}\\s*\\}\\}`, "g");
        replaced = replaced.replace(searchPattern, val);
      });
      return replaced;
    });
  };

  // 5. Export Word (.docx) from backend compile endpoint
  const handleExportWord = async () => {
    if (!selectedTemplateName) return;
    try {
      setExportingWord(true);
      const res = await fetch("/api/templates/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: selectedTemplateName, formValues })
      });
      if (!res.ok) throw new Error("Word compile failed on server");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BienBan_${stripVietnameseAccents(vehicle.plateNumber || "").replace(/\s+/g, "_")}_${selectedTemplateName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      logger.success("Đã xuất file Word.");
    } catch (err) {
      console.error("Word export failure:", err);
      logger.error("Không thể xuất Word.", err);
    } finally {
      setExportingWord(false);
    }
  };

  // 6. Export PDF via client-side jsPDF
  const handleExportPdf = () => {
    if (!selectedTemplate) return;
    try {
      setExportingPdf(true);
      // Create PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const lines = getReplacedTemplateLines();
      
      doc.setFont("Helvetica"); // Default fallback font
      let y = 20;
      
      // Page setup & title
      doc.setFontSize(16);
      doc.setFont("Helvetica", "bold");
      const titleWithoutAccent = stripVietnameseAccents(selectedTemplate.title);
      doc.text(titleWithoutAccent, 105, y, { align: "center" });
      y += 15;

      // Lines body
      doc.setFontSize(11);
      doc.setFont("Helvetica", "normal");
      
      lines.forEach(line => {
        // Strip out the header if it repeats the title
        if (line === selectedTemplate.title) return;
        
        const cleanLine = stripVietnameseAccents(line);
        // Page break safety
        if (y > 275) {
          doc.addPage();
          y = 20;
        }

        if (cleanLine.trim() === "") {
          y += 5;
        } else {
          // Wrapped text support
          const splitLines = doc.splitTextToSize(cleanLine, 170);
          splitLines.forEach((sl: string) => {
            doc.text(sl, 20, y);
            y += 6;
          });
        }
      });

      doc.save(`BienBan_${stripVietnameseAccents(vehicle.plateNumber || "").replace(/\s+/g, "_")}.pdf`);
      logger.success("Đã khởi tạo file PDF.");
    } catch (err) {
      console.error("PDF generation err:", err);
      logger.error("Không thể tạo file PDF.", err);
    } finally {
      setExportingPdf(false);
    }
  };

  // Human friendly labels for common system variables
  const formatVariableLabel = (v: string): string => {
    switch (v) {
      case "vehicleName": return "Tên/nhãn hiệu phương tiện";
      case "plate": return "Biển kiểm soát";
      case "chassis": return "Số khung xe (Chassis)";
      case "engine": return "Số máy xe";
      case "unit": return "Đơn vị tiếp nhận xe";
      case "repairShop": return "Cơ sở tiếp nhận sữa chữa";
      case "createdDate": return "Ngày lập mẫu";
      case "engineState": return "Đánh giá Động cơ";
      case "gearboxState": return "Đánh giá Hộp số";
      case "steeringState": return "Đánh giá Hệ thống lái/gầm";
      case "cabinState": return "Đánh giá Cabin/Thùng bệ";
      case "remedy": return "Đề xuất biện pháp sửa chữa";
      case "technician": return "Người tiếp nhận/Kỹ thuật viên";
      case "driver": return "Đồng chí lái xe bàn giao";
      case "recordNumber": return "Mã sổ kiểm định quân kỳ";
      case "checkTime": return "Thời gian khám xe";
      case "location": return "Địa điểm kiểm định";
      case "airBrakeSystem": return "Hệ thống khí nén/phanh";
      case "axleStatus": return "Hệ thống cầu trục vi sai";
      case "tireInflationSystem": return "Hệ thống bơm lốp tự động";
      case "starterSystem": return "Hệ thống khởi động sườn";
      case "conclusion": return "Kết luận chung";
      case "representativeTechnical": return "Đại diện Hội đồng Kỹ thuật";
      case "odometer": return "Số km vận hành (Odometer)";
      case "couplingStatus": return "Hộp ly hợp cơ học";
      case "coolingSystem": return "Hệ thống tản nhiệt nước";
      case "electricalSystem": return "Hệ thống bugi đánh lửa";
      case "winchSystem": return "Trục cáp tời cứu hộ";
      case "actionPlan": return "Phương án sửa chữa thi công";
      case "commander": return "Chỉ huy phê lệnh trực";
      case "proposalId": return "Mã đề xuất vật tư phụ tùng";
      case "hydraulicCabinSystem": return "Hệ thống xy-lanh nâng hạ ben";
      case "airCompressor": return "Cơ cấu trục máy nén khí";
      case "suspensionSystem": return "Hệ thống lá nhíp treo nhún";
      case "splitterGearbox": return "Hộp số phân phối chuyển tầng";
      case "partsEstimate": return "Khái toán vật tư sửa chữa";
      case "foreman": return "Tổ trưởng sửa chữa (Thợ cả)";
      default:
        // Camel case to words with spaces
        return v
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, str => str.toUpperCase());
    }
  };

  // Helper determining input field input types (textarea vs normal text inputs)
  const isLargeTextField = (v: string): boolean => {
    const vn = v.toLowerCase();
    return (
      vn.includes("status") ||
      vn.includes("state") ||
      vn.includes("remedy") ||
      vn.includes("conclusion") ||
      vn.includes("plan") ||
      vn.includes("estimate") ||
      vn.includes("system") ||
      vn.includes("compressor") ||
      vn.includes("gearbox")
    );
  };

  return (
    <>
      {/* Drawer Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs z-[200] transition-opacity"
        onClick={onClose}
      />

      {/* Main Drawer Container */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xl md:max-w-2xl bg-stone-50 border-l-4 border-emerald-850 shadow-2xl flex flex-col z-[201] overflow-hidden">
        
        {/* Drawer Header */}
        <div className="bg-emerald-850 text-white p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-300" />
            <div>
              <h3 className="font-bold tracking-tight text-sm uppercase">Biên bản chi tiết hư hỏng</h3>
              <p className="text-[10px] text-emerald-250 font-mono">Xe: {vehicle.plateNumber} ({vehicle.brand})</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 hover:bg-emerald-750 rounded-full transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-emerald-850 animate-spin" />
            <span className="text-stone-500 font-mono text-xs">Đang tải biểu mẫu...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            
            {/* Template Selector Section */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
              <label htmlFor="template-dropdown" className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                Mẫu biên bản kỹ thuật xe:
              </label>
              
              <select
                id="template-dropdown"
                value={selectedTemplateName}
                onChange={handleTemplateChange}
                className="w-full bg-stone-50 border-2 border-stone-200 rounded-lg py-2 px-3 text-sm focus:border-emerald-850 outline-none font-medium text-stone-800 transition-colors"
              >
                <option value="">-- [Chọn mẫu biên bản] --</option>
                {templates.map(t => (
                  <option key={t.fileName} value={t.fileName}>
                    {t.fileName} - {t.title}
                  </option>
                ))}
              </select>

              <div className="text-[10px] text-stone-400 font-mono">
                Thư mục tải mẫu: <span className="text-emerald-800 font-bold">templates/</span>
              </div>
            </div>

            {selectedTemplate ? (
              <div className="space-y-5 animate-fade-in">
                
                {/* Dynamically Generated Form Inputs */}
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-4">
                  <h4 className="border-b border-stone-150 pb-2 text-xs font-extrabold text-stone-800 uppercase tracking-widest flex items-center justify-between">
                    <span>Nhập thông tin hồ sơ</span>
                    <span className="text-[11px] font-mono font-medium text-emerald-750">
                      Tự động phát hiện ({selectedTemplate.variables.length} trường)
                    </span>
                  </h4>

                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTemplate.variables.map((variable) => {
                      const value = formValues[variable] || "";
                      const label = formatVariableLabel(variable);
                      const isLarge = isLargeTextField(variable);

                      if (isLarge) {
                        return (
                          <div key={variable} className="md:col-span-2 space-y-1.5">
                            <label className="block text-xs font-semibold text-stone-700">
                              {label} <span className="text-[10px] text-stone-400 font-mono">({`{{`}{variable}{`}}`})</span>
                            </label>
                            <textarea
                              rows={3}
                              value={value}
                              onChange={(e) => handleInputChange(variable, e.target.value)}
                              placeholder={`Nhập ${label.toLowerCase()}... (ví dụ: bị mòn pít-tông, rơ-le đánh lửa rạn nứt)`}
                              className="w-full bg-stone-55 border border-stone-200 rounded-lg p-3 text-xs focus:border-emerald-800 outline-none transition-colors"
                            />
                          </div>
                        );
                      }

                      return (
                        <div key={variable} className="space-y-1.5">
                          <label className="block text-xs font-semibold text-stone-700">
                            {label} <span className="text-[10px] text-stone-400 font-mono">({`{{`}{variable}{`}}`})</span>
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleInputChange(variable, e.target.value)}
                            placeholder={`Điền ${label.toLowerCase()}...`}
                            className="w-full bg-stone-55 border border-stone-200 rounded-lg py-2 px-3 text-xs focus:border-emerald-800 outline-none transition-colors"
                          />
                        </div>
                      );
                    })}
                  </form>
                </div>

                {/* Live Preview Text Card */}
                <div className="bg-stone-900 border border-stone-850 rounded-xl p-4 shadow-inner space-y-3">
                  <div className="flex justify-between items-center border-b border-stone-800 pb-2">
                    <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wide">Xem trước biên bản (Trực quan)</span>
                    <button
                      type="button"
                      onClick={() => setShowPrintPreview(true)}
                      className="text-[11px] font-semibold text-emerald-450 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Xem bản in dã ngoại (A4)</span>
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto text-[11px] text-stone-300 font-mono leading-relaxed space-y-2 whitespace-pre-wrap select-none p-1">
                    {getReplacedTemplateLines().join("\n")}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-stone-200 rounded-xl text-center space-y-2">
                <FileText className="h-10 w-10 text-stone-300 mx-auto" />
                <p className="text-xs text-stone-500 font-medium">Vui lòng chọn một mẫu từ danh sách ở trên để bắt đầu lập biên bản hư hại.</p>
              </div>
            )}

          </div>
        )}

        {/* Drawer Footer Actions */}
        <div className="bg-stone-100 border-t border-stone-200 p-4 shrink-0 flex flex-wrap gap-3 justify-between items-center">
          
          {/* Status logs */}
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs animate-bounce">
                <CheckCircle className="h-4 w-4" />
                <span>Đã lưu thành công vào Firestore!</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            
            {/* 1. Save (Lưu) */}
            <button
              type="button"
              disabled={!selectedTemplate || saving}
              onClick={handleSave}
              className={`py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer ${(!selectedTemplate || saving) && "opacity-50 cursor-not-allowed"}`}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Lưu Firestore</span>
            </button>

            {/* 2. Export Word (Xuất Word) */}
            <button
              type="button"
              disabled={!selectedTemplate || exportingWord}
              onClick={handleExportWord}
              className={`py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer ${(!selectedTemplate || exportingWord) && "opacity-50 cursor-not-allowed"}`}
            >
              {exportingWord ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>Xuất Word</span>
            </button>

            {/* 3. Export PDF (Xuất PDF) */}
            <button
              type="button"
              disabled={!selectedTemplate || exportingPdf}
              onClick={handleExportPdf}
              className={`py-2 px-3 bg-yellow-700 hover:bg-yellow-800 text-stone-900 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer ${(!selectedTemplate || exportingPdf) && "opacity-50 cursor-not-allowed"}`}
            >
              {exportingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
              <span>Xuất PDF</span>
            </button>

          </div>
        </div>
      </div>

      {/* Modern Print Preview Overlay Modal */}
      {showPrintPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
            
            {/* Title Bar block */}
            <div className="bg-stone-100 border-b border-stone-200 p-4 flex justify-between items-center sm:px-6">
              <span className="font-bold font-mono text-xs text-stone-700 uppercase tracking-widest">BẢN IN DÃ NGOẠI A4 TIÊU CHUẨN</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>In mẫu dã ngoại</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="bg-stone-300 hover:bg-stone-400 text-stone-800 py-1.5 px-3 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* Document layout */}
            <div 
              id="a4-print-document" 
              className="flex-1 overflow-y-auto p-8 sm:px-12 md:py-12 text-stone-900 font-serif leading-relaxed text-sm bg-white"
            >
              {/* ACCURATE MILITARY HEADING */}
              <div className="grid grid-cols-2 gap-4 border-b border-stone-300 pb-4 mb-6">
                <div className="text-center text-xs font-bold uppercase space-y-1">
                  <div>Tiểu đoàn SCTH30</div>
                  <div>Trạm Sửa chữa Quân đoàn 34</div>
                  <div className="font-mono text-[9px] font-normal text-stone-500">Mã: {selectedTemplateName}</div>
                </div>
                <div className="text-center text-xs font-bold space-y-1 uppercase">
                  <div className="tracking-wide">CỘNG HÀA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="normal-case font-semibold text-[11px] underline">Độc lập - Tự do - Hạnh phúc</div>
                </div>
              </div>

              {/* Title doc */}
              <h2 className="text-center font-bold text-lg mb-8 uppercase tracking-wide leading-snug">
                {selectedTemplate.title}
              </h2>

              {/* Printable Body text lines */}
              <div className="space-y-4 whitespace-pre-wrap leading-loose">
                {getReplacedTemplateLines().map((line, idx) => {
                  if (line === selectedTemplate.title) return null;
                  
                  if (line.trim() === "") {
                    return <div key={idx} className="h-2" />;
                  }

                  if (line.startsWith("- ")) {
                    return (
                      <div key={idx} className="pl-6 text-stone-850">
                        {line}
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="text-stone-850">
                      {line}
                    </div>
                  );
                })}
              </div>

              {/* Signatures area */}
              <div className="mt-12 pt-8 border-t border-dashed border-stone-200 grid grid-cols-2 text-center text-xs font-bold uppercase gap-6">
                <div>
                  <p className="not-italic text-stone-500 font-mono mb-12 capitalize">Đã bàn giao tiếp biên</p>
                  <p className="underline underline-offset-4">{formValues["driver"] || "Người lái xe"}</p>
                </div>
                <div>
                  <p className="not-italic text-stone-500 font-mono mb-12 capitalize">Sỹ quan nghiệm thu báo lỗi</p>
                  <p className="underline underline-offset-4">{formValues["technician"] || formValues["representativeTechnical"] || "Đại diện kỹ thuật"}</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Special styles injected for window printing overlay */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #a4-print-document, #a4-print-document * {
            visibility: visible !important;
          }
          #a4-print-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 2cm !important;
            box-shadow: none !important;
            border: none !important;
            font-size: 12pt !important;
          }
        }
      `}</style>
    </>
  );
};
