import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeTemplates, getTemplateVariables, compileExportDocx } from "./server_templates";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize templates on startup
initializeTemplates().catch((err) => {
  console.error("Failed to initialize templates:", err);
});

// API endpoint to list templates
app.get("/api/templates", async (req, res) => {
  try {
    const templatesDir = path.join(process.cwd(), "templates");
    if (!fs.existsSync(templatesDir)) {
      return res.json([]);
    }
    const files = fs.readdirSync(templatesDir).filter(f => f.endsWith(".docx"));
    const results = [];
    for (const f of files) {
      const info = await getTemplateVariables(f);
      results.push({
        fileName: f,
        title: info.title,
        variables: info.variables,
        markdown: info.markdown
      });
    }
    res.json(results);
  } catch (error) {
    console.error("Failed to list templates:", error);
    res.status(500).json({ error: "Failed to load templates list" });
  }
});

// API endpoint to export filled DOCX template
app.post("/api/templates/export-docx", async (req, res) => {
  const { fileName, formValues } = req.body;
  if (!fileName || !formValues) {
    return res.status(400).json({ error: "Missing fileName or formValues in body" });
  }
  try {
    const buffer = await compileExportDocx(fileName, formValues);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.send(buffer);
  } catch (error: any) {
    console.error("Failed to compile DOCX export:", error);
    res.status(500).json({ error: error.message || "Export failed" });
  }
});

// Initialize Gemini client strictly using Server-Side guidelines with User-Agent header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Warning: GEMINI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// API endpoint for AI diagnostic suggestions
app.post("/api/ai/suggest", async (req, res) => {
  const { note } = req.body;
  if (!note || typeof note !== "string" || note.trim() === "") {
    return res.status(400).json({ error: "Ghi chú không được để trống." });
  }

  const ai = getGeminiClient();
  if (process.env.GEMINI_API_KEY === undefined) {
    // Graceful fallback when the key is missing to avoid crashing
    return res.json({
      possibilities: [
        "Cần kiểm tra chi tiết theo ghi chú",
        "Có thể do mài mòn tự nhiên",
        "Đề xuất kiểm tra hệ thống điều khiển liên quan"
      ]
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Hãy phân tích tình trạng xe dựa trên ghi chú sau bằng tiếng Việt: "${note}". Đưa ra từ 2-4 khả năng hư hỏng hoặc nguyên nhân liên quan dưới dạng danh sách ngắn gọn.`,
      config: {
        systemInstruction: "Bạn là một kỹ sơ sửa chữa ô tô chuyên nghiệp, giàu kinh nghiệm. Bạn luôn đưa ra những dự đoán chính xác, ngắn gọn và thực tế về các lỗi kỹ thuật và bộ phận cần kiểm tra dựa trên ghi chú hiện tượng của xe.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            possibilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Các bộ phận hoặc lỗi kỹ thuật có khả năng xảy ra nhất, viết bằng tiếng Việt ngắn gọn, chuyên nghiệp."
            }
          },
          required: ["possibilities"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Không thể trích xuất phản hồi từ Gemini.");
    }

    const data = JSON.parse(text.trim());
    res.json({ possibilities: data.possibilities });
  } catch (error) {
    console.error("Gemini suggestion error:", error);
    res.status(500).json({
      error: "Đã xảy ra lỗi khi tạo phản hồi từ AI",
      possibilities: [
        "Má phanh hoặc đĩa phanh bị mòn",
        "Hệ thống truyền động hoặc khớp các đăng bị mài mòn",
        "Áp suất hoặc cân bằng động lốp xe không chuẩn"
      ]
    });
  }
});

// Configure Vite middleware or Static files serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to boot server:", err);
});
