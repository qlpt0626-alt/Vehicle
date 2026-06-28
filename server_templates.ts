import fs from "fs";
import path from "path";
import JSZip from "jszip";

const TEMPLATES_DIR = path.join(process.cwd(), "templates");

// Minimal DOCX file utility XML generators
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
}

function convertTextToDocxXml(title: string, contentLines: string[]): string {
  let paragraphs = "";

  // Title run
  paragraphs += `<w:p>
    <w:pPr>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:b/>
        <w:sz w:val="32"/>
      </w:rPr>
      <w:t>${escapeXml(title)}</w:t>
    </w:r>
  </w:p>`;

  // Break space
  paragraphs += `<w:p><w:r><w:t></w:t></w:r></w:p>`;

  // Lines
  for (const line of contentLines) {
    if (line.trim() === "") {
      paragraphs += `<w:p><w:r><w:t></w:t></w:r></w:p>`;
    } else if (line.startsWith("- ")) {
      paragraphs += `<w:p>
        <w:pPr>
          <w:ind w:left="400"/>
        </w:pPr>
        <w:r>
          <w:t>${escapeXml(line)}</w:t>
        </w:r>
      </w:p>`;
    } else {
      paragraphs += `<w:p>
        <w:r>
          <w:t>${escapeXml(line)}</w:t>
        </w:r>
      </w:p>`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs}
  </w:body>
</w:document>`;
}

async function createDocxBuffer(documentXmlText: string): Promise<Buffer> {
  const zip = new JSZip();
  
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  zip.file("[Content_Types].xml", contentTypesXml);
  zip.file("_rels/.rels", relsXml);
  zip.file("word/document.xml", documentXmlText);
  
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  return zipBuffer;
}

// 1. Initializer function for mock templates
export async function initializeTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
    console.log("Created directory:", TEMPLATES_DIR);
  }

  const defaultTemplates = [
    {
      fileName: "GAZ66.docx",
      title: "BIÊN BẢN CỤM CHI TIẾT HƯ HỎNG - XE GAZ-66",
      lines: [
        "Số hiệu hành chính: 104/BB-KTH-GAZ",
        "",
        "Hôm nay, ngày quân kỳ lập biên bản tại {{repairShop}}.",
        "Hội đồng kiểm định chất lượng tiến hành giám định phương tiện GAZ-66 sau:",
        "",
        "- Tên xe sửa chữa: {{vehicleName}}",
        "- Biển kiểm soát dã ngoại: {{plate}}",
        "- Số khung gầm xi-nhan: {{chassis}}",
        "- Số khối động cơ: {{engine}}",
        "- Thuộc biên chế cấp đơn vị: {{unit}}",
        "",
        "Qua kiểm định kỹ thuật lâm sàng và chuẩn đoán thực nghiệm chuyên sâu:",
        "- Tình trạng động cơ xi-lanh: {{engineState}}",
        "- Hộp số truyền động phụ: {{gearboxState}}",
        "- Trục các đăng lực ly hợp: {{steeringState}}",
        "- Toàn bộ vỏ cabin bệ thùng: {{cabinState}}",
        "",
        "Đề xuất biện pháp khắc phục xử lý của Hội đồng:",
        "{{remedy}}",
        "",
        "Các đồng chí sau bàn giao ký tên lập biên bản:",
        "- Sỹ quan kỹ thuật chuyên trách: {{technician}}",
        "- Đồng chí lái xe tiếp nhận: {{driver}}"
      ]
    },
    {
      fileName: "Ural4320.docx",
      title: "BIÊN BẢN KHÁM HƯ HỎNG CHI TIẾT - PHƯƠNG TIỆN URAL-4320",
      lines: [
        "Danh mục kiểm tra kỹ thuật số: {{recordNumber}}",
        "",
        "Thời gian kiểm kê kỹ thuật: {{checkTime}}",
        "Địa điểm lập hồ sơ biên bản: {{location}}",
        "",
        "- Nhãn mác phương tiện: {{vehicleName}}",
        "- Biển số kiểm soát quân sự: {{plate}}",
        "- Mã hiệu số khung xi-nhan: {{chassis}}",
        "- Số máy động lực học: {{engine}}",
        "- Đơn vị quản lý sử dụng: {{unit}}",
        "",
        "Hồ sơ khám hỏng kỹ thuật chi tiết xe Ural-4320 thực hiện:",
        "- Hệ thống nén khí nạp phanh hơi: {{airBrakeSystem}}",
        "- Cơ cấu các đăng vi sai truyền động: {{axleStatus}}",
        "- Bộ phận kiểm soát áp suất lốp tự động: {{tireInflationSystem}}",
        "- Máy khởi động & củ phát điện: {{starterSystem}}",
        "",
        "Kết luận chung và kiến nghị của Hội đồng kỹ thuật:",
        "{{conclusion}}",
        "",
        "Biên bản lập thành hai bản, có giá trị pháp lý quân sự kĩnh trực.",
        "- Đại diện ban kỹ thuật phê chuẩn: {{representativeTechnical}}",
        "- Lái xe kiêm trưởng xe chịu trách nhiệm: {{driver}}"
      ]
    },
    {
      fileName: "Zil131.docx",
      title: "BIÊN BẢN CHUẨN ĐOÁN HƯ HỎNG HÃNG XE ZIL-131",
      lines: [
        "Mã số biểu văn quân khí: ZIL-131/BB",
        "",
        "Hội đồng kỹ thuật tiến hành rà soát lỗi hỏng xe bộ binh Zil-131:",
        "- Phương tiện mác hiệu: {{vehicleName}}",
        "- Biển số xe: {{plate}}",
        "- Số sườn khung: {{chassis}}",
        "- Số máy xi lanh: {{engine}}",
        "- Thuộc Tiểu đoàn vận tải: {{unit}}",
        "- Chỉ số công tơ mét hiện tại: {{odometer}}",
        "",
        "Ghi nhận đo đạc chuyên môn chính thức:",
        "- Trạng thái bộ ly hợp & hộp số: {{couplingStatus}}",
        "- Kết cấu két hệ thống nước làm mát: {{coolingSystem}}",
        "- Hệ thống đánh lửa & bu-gi điện cực: {{electricalSystem}}",
        "- Cơ cấu tời cáp cứu hộ phía trước đầu xe: {{winchSystem}}",
        "",
        "Kiến nghị phương án hành động chính yếu khắc phục:",
        "{{actionPlan}}",
        "",
        "- Người duyệt phê lệnh chỉ huy: {{commander}}",
        "- Người khám xe trực tiếp thợ cả: {{technician}}"
      ]
    },
    {
      fileName: "Kamaz.docx",
      title: "BIÊN BẢN KHÁM HỎNG VÀ KHẢO SÁT VẬT TƯ XE TRUCK KAMAZ",
      lines: [
        "Mã số hồ sơ kiến nghị: {{proposalId}}",
        "",
        "Kính gửi: Hội đồng thẩm định Kỹ thuật Tiểu đoàn SCTH30",
        "Chúng tôi báo cáo chi tiết khám xe vận tải Kamaz sau dã ngoại:",
        "",
        "- Loại máy xe: {{vehicleName}}",
        "- Biển đăng ký: {{plate}}",
        "- Số khung gầm chính: {{chassis}}",
        "- Số hiệu máy nạp: {{engine}}",
        "- Trực thuộc đơn vị đại đội: {{unit}}",
        "",
        "Tình trạng hư tổn các cơ cấu chính xe chở quân Kamaz:",
        "- Xi lanh thủy lực đẩy nâng cabin: {{hydraulicCabinSystem}}",
        "- Máy củ nén khí nạp hãm phanh: {{airCompressor}}",
        "- Hệ thống lá nhíp cơ cấu cầu treo: {{suspensionSystem}}",
        "- Hệ thống hộp số chuyển tầng truyền động: {{splitterGearbox}}",
        "",
        "Khái toán tổng hợp phụ tùng cần cấp phát sửa chữa:",
        "{{partsEstimate}}",
        "",
        "- Tổ trưởng kỹ thuật sửa chữa: {{foreman}}",
        "- Thượng tá, đại diện xét duyệt chi lệnh: {{commander}}"
      ]
    }
  ];

  for (const t of defaultTemplates) {
    const filePath = path.join(TEMPLATES_DIR, t.fileName);
    if (!fs.existsSync(filePath)) {
      console.log(`Generating blank real docx template: ${t.fileName}...`);
      const xmlDoc = convertTextToDocxXml(t.title, t.lines);
      const docxBuffer = await createDocxBuffer(xmlDoc);
      fs.writeFileSync(filePath, docxBuffer);
    }
  }
}

// 2. Extracts variables inside word/document.xml of a DOCX file buffer
export async function getTemplateVariables(fileName: string): Promise<{ title: string; variables: string[]; markdown: string }> {
  const filePath = path.join(TEMPLATES_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file ${fileName} does not exist`);
  }

  const docxBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(docxBuffer);
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) {
    throw new Error(`Invalid DOCX: No word/document.xml found in ${fileName}`);
  }

  const docXmlText = await docXmlFile.async("string");

  // Parse w:t contents from document.xml to recreate text structure and find clean fields
  // A clean matching list
  const cleanVariables: string[] = [];
  const variablesSet = new Set<string>();

  // A very friendly scanning regex for {{variableName}}
  const varRegex = /\{\{([^}]+)\}\}/g;
  let match;
  while ((match = varRegex.exec(docXmlText)) !== null) {
    const varName = match[1].trim();
    if (varName && !variablesSet.has(varName)) {
      variablesSet.add(varName);
      cleanVariables.push(varName);
    }
  }

  // To build a readable layout/markdown preview
  // Strip xml tags to expose plain text lines
  const textLines: string[] = [];
  const pRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
  let pMatch;
  while ((pMatch = pRegex.exec(docXmlText)) !== null) {
    const pContent = pMatch[1];
    let pText = "";
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let tMatch;
    while ((tMatch = tRegex.exec(pContent)) !== null) {
      pText += tMatch[1];
    }
    if (pText.trim() !== "" || textLines.length > 0) {
      textLines.push(pText);
    }
  }

  // Extract a beautiful header title if possible
  const firstLine = textLines.find(l => l.trim() !== "") || fileName;

  return {
    title: firstLine,
    variables: cleanVariables,
    markdown: textLines.join("\n")
  };
}

// 3. Merges custom inputs with DOCX word/document.xml variables
export async function compileExportDocx(fileName: string, formValues: Record<string, string>): Promise<Buffer> {
  const filePath = path.join(TEMPLATES_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file ${fileName} does not exist`);
  }

  const docxBuffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(docxBuffer);
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) {
    throw new Error(`Invalid DOCX: No word/document.xml found in ${fileName}`);
  }

  let docXmlText = await docXmlFile.async("string");

  // Replaces each {{variable}} safely
  for (const [key, value] of Object.entries(formValues)) {
    const cleanValue = escapeXml(value || "");
    
    // We replace exact patterns like {{key}}
    // Word might separate { { sometimes if created manually, but here we enforce programmatic clean templates.
    // So simple replacement works beautifully.
    const searchPattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    docXmlText = docXmlText.replace(searchPattern, cleanValue);
  }

  // Re-zip the document
  zip.file("word/document.xml", docXmlText);
  return zip.generateAsync({ type: "nodebuffer" });
}
