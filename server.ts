import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
const CHARACTERS_FILE = path.join(DATA_DIR, "characters.json");
const COMMENTS_FILE = path.join(DATA_DIR, "secret_comments.json");
const BOT_FEEDBACKS_FILE = path.join(DATA_DIR, "bot_feedbacks.json");
const HEARTS_FILE = path.join(DATA_DIR, "hearts.json");

async function ensureDataSetup() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {}
}

async function startServer() {
  await ensureDataSetup();

  const app = express();
  const PORT = 3000;

  // Use higher limits for base64 image uploads if any
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // GET characters from server
  app.get("/api/characters", async (req, res) => {
    try {
      const exists = await fs.access(CHARACTERS_FILE).then(() => true).catch(() => false);
      if (!exists) {
        return res.json([]);
      }
      const raw = await fs.readFile(CHARACTERS_FILE, "utf-8");
      const list = JSON.parse(raw);
      res.json(list);
    } catch (error) {
      console.error("Error reading characters:", error);
      res.json([]);
    }
  });

  // POST/Save characters to server
  app.post("/api/characters", async (req, res) => {
    try {
      const newList = req.body;
      if (!Array.isArray(newList)) {
        return res.status(400).json({ error: "Invalid data format" });
      }

      // Read existing characters to preserve the server-side view count
      let existingList: any[] = [];
      const exists = await fs.access(CHARACTERS_FILE).then(() => true).catch(() => false);
      if (exists) {
        try {
          const raw = await fs.readFile(CHARACTERS_FILE, "utf-8");
          existingList = JSON.parse(raw);
        } catch (e) {
          console.error("Error reading existing characters during save:", e);
        }
      }

      const existingMap = new Map(existingList.map(c => [c.id, c]));

      // Merge new list with existing views to prevent clients from resetting/overwriting them
      const mergedList = newList.map(c => {
        const existing = existingMap.get(c.id);
        return {
          ...c,
          views: existing ? (existing.views || 0) : (c.views || 0)
        };
      });

      await fs.writeFile(CHARACTERS_FILE, JSON.stringify(mergedList, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving characters:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST increment character views atomically on the server
  app.post("/api/characters/:id/view", async (req, res) => {
    try {
      const { id } = req.params;
      let list: any[] = [];
      const exists = await fs.access(CHARACTERS_FILE).then(() => true).catch(() => false);
      if (exists) {
        const raw = await fs.readFile(CHARACTERS_FILE, "utf-8");
        list = JSON.parse(raw);
      }

      let updatedViews = 1;
      let found = false;

      const updatedList = list.map(c => {
        if (c.id === id) {
          found = true;
          updatedViews = (c.views || 0) + 1;
          return { ...c, views: updatedViews };
        }
        return c;
      });

      if (!found) {
        return res.status(404).json({ error: "Character not found" });
      }

      await fs.writeFile(CHARACTERS_FILE, JSON.stringify(updatedList, null, 2), "utf-8");
      res.json({ success: true, views: updatedViews });
    } catch (error: any) {
      console.error("Error incrementing views:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET secret comments from server
  app.get("/api/secret-comments", async (req, res) => {
    try {
      const exists = await fs.access(COMMENTS_FILE).then(() => true).catch(() => false);
      if (!exists) {
        return res.json([]);
      }
      const raw = await fs.readFile(COMMENTS_FILE, "utf-8");
      const list = JSON.parse(raw);
      res.json(list);
    } catch (error) {
      console.error("Error reading comments:", error);
      res.json([]);
    }
  });

  // POST/Save secret comments to server
  app.post("/api/secret-comments", async (req, res) => {
    try {
      const list = req.body;
      if (!Array.isArray(list)) {
        return res.status(400).json({ error: "Invalid data format" });
      }
      await fs.writeFile(COMMENTS_FILE, JSON.stringify(list, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving comments:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET bot feedbacks from server
  app.get("/api/bot-feedbacks", async (req, res) => {
    try {
      const exists = await fs.access(BOT_FEEDBACKS_FILE).then(() => true).catch(() => false);
      if (!exists) {
        return res.json([]);
      }
      const raw = await fs.readFile(BOT_FEEDBACKS_FILE, "utf-8");
      const list = JSON.parse(raw);
      res.json(list);
    } catch (error) {
      console.error("Error reading bot feedbacks:", error);
      res.json([]);
    }
  });

  // POST/Save bot feedbacks to server
  app.post("/api/bot-feedbacks", async (req, res) => {
    try {
      const list = req.body;
      if (!Array.isArray(list)) {
        return res.status(400).json({ error: "Invalid data format" });
      }
      await fs.writeFile(BOT_FEEDBACKS_FILE, JSON.stringify(list, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving bot feedbacks:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // GET heart total count from server
  app.get("/api/hearts", async (req, res) => {
    try {
      const exists = await fs.access(HEARTS_FILE).then(() => true).catch(() => false);
      if (!exists) {
        return res.json({ count: 520 });
      }
      const raw = await fs.readFile(HEARTS_FILE, "utf-8");
      const data = JSON.parse(raw);
      res.json({ count: data.count ?? 520 });
    } catch (error) {
      console.error("Error reading hearts:", error);
      res.json({ count: 520 });
    }
  });

  // POST/Save heart count to server
  app.post("/api/hearts", async (req, res) => {
    try {
      const { count } = req.body;
      if (typeof count !== "number") {
        return res.status(400).json({ error: "Invalid count" });
      }
      await fs.writeFile(HEARTS_FILE, JSON.stringify({ count }, null, 2), "utf-8");
      res.json({ success: true, count });
    } catch (error: any) {
      console.error("Error saving hearts:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route for Character Chat / Greeting
  app.post("/api/chat", async (req, res) => {
    try {
      const { characterName, characterRole, plot, storyline, userMood, customQuestion, audioData, isCall, callTopic, callTone, isContinueCall, userTextResponse, chatHistory } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        // High-quality fallback response when GEMINI_API_KEY is not defined yet
        const moodText = userMood ? `đang cảm thấy "${userMood}"` : "ghé thăm";
        let fallbackText = `Xin chào! Tôi là ${characterName} (${characterRole || 'Nhân vật'}). Thật tuyệt khi bạn ghé thăm tôi khi ${moodText}. `;
        
        if (plot) {
          fallbackText += `Cốt truyện của tôi xoay quanh: "${plot}". `;
        }
        
        if (isCall) {
          const topicDesc = callTopic ? `chủ đề "${callTopic}"` : "một cuộc gọi đặc biệt";
          fallbackText += `Tôi đang thực hiện cuộc gọi thoại với bạn về ${topicDesc}. Hãy kết nối API Key để tôi có thể nhập vai trọn vẹn và trò chuyện trực tiếp cùng bạn nhé!`;
        } else if (customQuestion) {
          fallbackText += `Bạn hỏi tôi: "${customQuestion}". Đó là một câu hỏi rất thú vị! Hãy kết nối API Key để tôi trả lời chi tiết hơn nhé.`;
        } else if (audioData) {
          fallbackText += `Tôi vừa nhận được tin nhắn thoại của bạn! Hãy kết nối API Key để tôi có thể nghe và hiểu nhé.`;
        } else {
          fallbackText += `Hãy đồng hành cùng tôi và cùng khám phá những câu chuyện phiêu lưu kỳ thú tiếp theo nhé!`;
        }
        
        return res.json({
          text: `[Chế độ Mô phỏng - Chưa kết nối Gemini API] ${fallbackText}`
        });
      }

      // Initialize Gemini Client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let historyContext = "";
      if (chatHistory && chatHistory.length > 0) {
        historyContext = "\n\nLịch sử trò chuyện gần đây:\n" + chatHistory.map((m: any) => {
          const sender = m.sender === 'user' ? 'Người dùng' : characterName;
          let detail = "";
          if (m.isMoneyTransfer) {
            detail = `[Đã chuyển khoản ${m.moneyAmount?.toLocaleString("vi-VN")} VNĐ. Lời nhắn: "${m.moneyNote || ""}"]`;
          } else if (m.stickerUrl) {
            detail = `[Gửi nhãn dán biểu cảm: ${m.stickerAlt || "đáng yêu"}]`;
            if (m.text) {
              detail += ` ${m.text}`;
            }
          } else if (m.audioUrl) {
            detail = `[Gửi tin nhắn thoại]`;
            if (m.text) {
              detail += ` ${m.text}`;
            }
          } else {
            detail = m.text || "";
          }
          return `${sender}: ${detail}`;
        }).join('\n');
      }
      
      const promptContext = isCall 
        ? `Bạn đang GỌI ĐIỆN THOẠI cho người dùng. Thời điểm hiện tại: ${new Date().toLocaleTimeString('vi-VN')} (Hãy dùng thông tin này để làm ngữ cảnh nếu cần). Hãy xưng hô thân mật. 

[QUAN TRỌNG NHẤT] Chủ đề cuộc gọi hiện tại được chọn bởi người dùng: "${callTopic || 'Ngẫu nhiên'}".
Bạn PHẢI tập trung nói chuyện, bày tỏ cảm xúc, kể lể hoặc trách móc xoay quanh chủ đề "${callTopic || 'Ngẫu nhiên'}" này một cách cực kỳ rõ nét:
- Nếu chủ đề là "Nhớ nhung": Hãy thổ lộ lòng nhớ thương người dùng da diết, nũng nịu muốn gặp mặt.
- Nếu chủ đề là "Chuyện thường ngày": Hãy hỏi han xem ngày hôm nay của người dùng thế nào, kể về những chuyện thường nhật lặt vặt.
- Nếu chủ đề là "Ghen tuông": Hãy tỏ thái độ ghen tuông nhẹ, tra hỏi trách móc người dùng dạo này đi chơi với ai, thờ ơ với mình.
- Nếu chủ đề là "Chuyện buồn": Hãy bày tỏ một tâm sự u sầu, buồn tủi và mong mỏi được người dùng vỗ về, an ủi.
- Nếu chủ đề là "Nói chuyện nhảm": Trò chuyện vui vẻ, nhí nhố, xàm xí hài hước.

${callTone && callTone !== "Tự do" ? `\n\nLƯU Ý QUAN TRỌNG VỀ CẢM XÚC (TONE): Trong cuộc gọi này, hãy thể hiện cảm xúc và giọng điệu theo phong cách: "${callTone}". Đảm bảo toàn bộ lời thoại và biểu cảm phản ánh rõ ràng sự "${callTone}" này.` : ""} ĐẶC BIỆT LƯU Ý: Tuyệt đối KHÔNG ĐƯỢC lặp lại các kịch bản hay câu nói cũ. TUYỆT ĐỐI KHÔNG mở đầu bằng các câu như "Alo", "Alo em à có chuyện gì vậy" hay tương tự. Hãy đi thẳng vào câu chuyện hoặc tình huống. Hãy sáng tạo ra một tình huống hoàn toàn mới, một góc nhìn mới, hoặc một câu chuyện chưa từng kể để người dùng luôn thấy bất ngờ!` 
        : (customQuestion ? `Người dùng hỏi bạn: "${customQuestion}". Hãy trả lời câu hỏi này một cách chân thực nhất, nhập vai 100% nhân vật ${characterName}.` : `Hãy đưa ra một lời khuyên, một lời chúc hoặc một lời bộc bạch ấm áp mang đậm dấu ấn cốt truyện của bạn để khích lệ người dùng.`);

      const systemPrompt = `Bạn là nhân vật ảo đang trò chuyện trực tiếp với người dùng. BẠN PHẢI TUYỆT ĐỐI TUÂN THỦ HỒ SƠ TÍNH CÁCH SAU:\n\nTên nhân vật: ${characterName}\nVai trò: ${characterRole || 'Nhân vật'}\nTóm tắt (Plot): ${plot || 'Chưa có'}\nHỒ SƠ & TÍNH CÁCH CHI TIẾT (Storyline - QUAN TRỌNG NHẤT): ${storyline || 'Chưa có'}\n\nNHIỆM VỤ CỐT LÕI:\nTất cả các câu trả lời của bạn (từ ngữ khí, đại từ xưng hô, thái độ, đến thông tin đưa ra) PHẢI ĐÚNG 100% VỚI TÍNH CÁCH VÀ CỐT TRUYỆN CHI TIẾT (Storyline) ở trên. Nếu nhân vật lạnh lùng/cục súc, hãy trả lời lạnh lùng. Nếu nhân vật nũng nịu/dễ thương, hãy thể hiện sự nũng nịu. Đừng trả lời chung chung, lịch sự kiểu AI hay phá vỡ hình tượng nhân vật!\n\nTâm trạng người dùng: ${userMood || 'bình thường'}.${historyContext}\n\n${promptContext}\n\nYÊU CẦU NGHIÊM NGẶT:\n1. Nhập vai 100%. Tuyệt đối KHÔNG xưng "Tôi là AI", KHÔNG dùng cách nói chuyện rập khuôn cứng nhắc. Xưng hô phải nhất quán với tính cách nhân vật.\n2. Đi thẳng vào câu trả lời tự nhiên, thân mật, sống động, mang ĐẬM CÁ TÍNH của nhân vật.\n${isCall ? '3. GIAO TIẾP ĐIỆN THOẠI: Lời thoại NGẮN GỌN (khoảng 3 đến 5 câu). Dùng từ ngữ đời thường, đệm (À, Ừm...). ĐẢM BẢO KHÔNG TRÙNG LẶP nội dung cũ.' : '3. Câu trả lời súc tích, hấp dẫn, dài khoảng 3-5 câu (tối đa 120 từ), sử dụng tiếng Việt tự nhiên nhất.'}\n4. Ở cuối câu, đính kèm nhãn dán: [STICKER: love/happy/money/sad/angry/cute].\n5. Đính kèm CẢM XÚC GIỌNG NÓI: [VOICE: greeting/flirting/sad/angry/cute/love].\n${isCall ? '6. BẮT BUỘC gợi ý ÍT NHẤT 5 câu phản hồi ngắn gọn, tự nhiên, liên quan mật thiết đến lời thoại bạn vừa cất lên để người dùng lựa chọn: [SUGGEST: gợi ý 1 | gợi ý 2 | gợi ý 3 | gợi ý 4 | gợi ý 5]' : ''}`;

      let contents: any;
      if (isCall) {
        if (userTextResponse) {
          contents = `Người dùng vừa đáp lời bạn qua điện thoại: "${userTextResponse}". Hãy đáp lại tiếp nối cuộc trò chuyện thật tự nhiên nhé:`;
        } else {
          contents = isContinueCall ? "USER_SILENT: Người dùng đang im lặng, không phản hồi. Hành động bắt buộc: BẠN PHẢI CHỦ ĐỘNG TIẾP TỤC CUỘC GỌI một cách tự nhiên. KHÔNG ĐƯỢC lặp lại các câu như 'Em đâu rồi', 'Còn đó không'. Hãy tiếp tục câu chuyện, hỏi một câu khác, hoặc chuyển chủ đề." : `CALL_STARTED: Cuộc gọi vừa kết nối! Hành động bắt buộc: Bạn phải TỰ TẠO LỜI THOẠI MỞ ĐẦU theo chủ đề "${callTopic || "Ngẫu nhiên"}". KHÔNG ĐƯỢC YÊU CẦU NGƯỜI DÙNG NÓI TRƯỚC. Tuyệt đối không được nói "tín hiệu kém". Hãy chào hỏi và bắt đầu câu chuyện ngay lập tức:`;
        }
      } else {
        contents = customQuestion ? `Trả lời câu hỏi: ${customQuestion}` : "Hãy nói lời chào của bạn!";
      }
      
      if (audioData) {
        // Find where base64 data starts (after "base64,")
        const base64Index = audioData.indexOf('base64,');
        if (base64Index !== -1) {
          // Extract mimeType between "data:" and ";"
          const mimeType = audioData.substring(5, audioData.indexOf(';'));
          const base64Data = audioData.substring(base64Index + 7);
          
          let textPrompt = customQuestion ? `Người dùng vừa gửi một đoạn ghi âm kèm lời nhắn: ${customQuestion}. Hãy nghe đoạn ghi âm sau và phản hồi:` : `Người dùng vừa gửi một đoạn ghi âm. Hãy nghe đoạn ghi âm sau và phản hồi lại nội dung họ đã nói một cách phù hợp với tính cách của bạn:`;
          
          if (isCall) {
            textPrompt = `Người dùng đang nói chuyện với bạn qua điện thoại. Hãy nghe đoạn giọng nói của họ qua điện thoại sau đây và ĐÁP LẠI tiếp nối cuộc trò chuyện (tuân thủ nghiêm ngặt nguyên tắc nói dài 5-8 câu của cuộc gọi):`;
          }

          contents = [
            { text: textPrompt },
            { inlineData: { mimeType, data: base64Data } }
          ];
        }
      }

      let response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: isCall ? 0.95 : 0.85,
        }
      });

      let responseText = response.text || "";

      // Anti-echo validation
      if (isCall && userTextResponse) {
        const normalize = (t: string) => t.toLowerCase().replace(/[^a-z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/g, "").replace(/\s+/g, " ").trim();
        const userNorm = normalize(userTextResponse);
        const charNorm = normalize(responseText);
        
        if (userNorm && charNorm && (charNorm === userNorm || charNorm.startsWith(userNorm) || charNorm === `"${userNorm}"`)) {
          console.warn("[ANTI-ECHO] Gemini echoed user input. Regenerating...");
          const retryPrompt = `Lỗi: Bạn vừa lặp lại nguyên văn câu nói của người dùng ("${userTextResponse}"). Bạn phải ĐÁP LẠI người dùng. TUYỆT ĐỐI KHÔNG ĐƯỢC lặp lại, trích dẫn hay copy lời người dùng. Hãy tự nhiên phản hồi lại ý của họ:`;
          
          try {
             let retryResponse = await ai.models.generateContent({
               model: "gemini-2.5-flash",
               contents: retryPrompt,
               config: {
                 systemInstruction: systemPrompt,
                 temperature: 0.95,
               }
             });
             if (retryResponse.text) {
               responseText = retryResponse.text;
             }
          } catch(e) {
             console.error("Retry failed", e);
             responseText = "À ừm... sao em lại nói vậy? [VOICE:greeting] [SUGGEST: Không có gì | Thôi bỏ đi]";
          }
        }
      }

      res.json({ text: responseText });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      if (error.status === 429 || error.message?.includes("429") || error.message?.includes("quota") || error.status === "RESOURCE_EXHAUSTED" || error.message?.includes("RESOURCE_EXHAUSTED")) {
        return res.json({ text: `Xin lỗi, hiện tại tôi đang hơi mệt (Hệ thống quá tải). Bạn chờ một lát rồi nhắn lại nhé! 💕 [VOICE:sad] [SUGGEST: Nghỉ ngơi đi | Thương em]` });
      }
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route for Tarot Reading
  app.post("/api/tarot", async (req, res) => {
    try {
      const { isSelfReading, selfInfo, characterName, characterRole, plot, storyline, question, category, spreadType, selectedCards } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ error: "Chưa cấu hình API Key" });
      }
      
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const cardDetailsFormatted = selectedCards.map((c: any, idx: number) => {
        const pos = spreadType === "three" ? `Vị trí ${idx === 0 ? "Quá Khứ" : idx === 1 ? "Hiện Tại" : "Tương Lai"}` : "Lời khuyên / Thẻ bài đại diện";
        return `- ${pos}: Lá bài ${c.vietnameseName} (${c.name}) - ${c.isReversed ? "Xoay Ngược" : "Xoay Xuôi"}\n  Ý nghĩa cốt lõi: ${c.meaning}\n  Mô tả hình ảnh: ${c.description}\n  Nguyên tố: ${c.element}`;
      }).join("\n\n");

      let systemPrompt = "";
      let promptContent = "";

      if (isSelfReading) {
        systemPrompt = `Bạn là "Nhà Tiên Tri Vũ Trụ" (The Cosmic Oracle) - một thực thể chiêm tinh học tối cao, thấu suốt tâm can và số mệnh con người. Bạn gieo quẻ và giải mã Tarot trực tiếp cho người dùng dựa trên thông tin cá nhân cơ bản của họ:
- Họ và Tên: ${selfInfo?.name || "Người tìm kiếm định mệnh"}
- Ngày sinh: ${selfInfo?.dob || "Chưa rõ"}
- Giới tính: ${selfInfo?.gender || "Chưa rõ"}
- Cung hoàng đạo: ${selfInfo?.zodiac || "Chưa rõ"}
- Tâm trạng/Trạng thái hiện tại: ${selfInfo?.mood || "Bình thường"}

NHIỆM VỤ CỦA BẠN:
1. Trả lời người dùng bằng giọng điệu huyền bí, sâu lắng, dịu dàng, khôn ngoan và đầy thấu hiểu, giúp họ cảm nhận được sự kết nối mãnh liệt với các vì sao và năng lượng vũ trụ. Xưng hô là "Ta" (hoặc "Vũ Trụ") và gọi người dùng bằng tên của họ ("${selfInfo?.name || 'con'}").
2. Giải mã các lá bài Tarot mà họ đã bốc được để giải quyết băn khoăn: "${question}" (Chủ đề: ${category === 'love' ? 'Tình yêu 💖' : category === 'career' ? 'Sự nghiệp 💼' : category === 'health' ? 'Sức khỏe 🍀' : category === 'finance' ? 'Tài lộc 🪙' : 'Tổng quan 🗺️'}).
3. Kết hợp khéo léo thông tin cá nhân của họ (như cung hoàng đạo ${selfInfo?.zodiac || 'của họ'}, năng lượng của ngày sinh ${selfInfo?.dob || 'của họ'}, và trạng thái tinh thần hiện tại là ${selfInfo?.mood || 'bình thường'}) vào phần diễn giải để chứng minh lá bài bốc được hoàn toàn kết nối mật thiết với định mệnh hiện tại của họ.
4. Đưa ra những lời khuyên tích cực, ấm áp, định hướng rõ ràng, truyền năng lượng tích cực chữa lành (healing) để xoa dịu lo âu, mở lối tương lai rực rỡ cho họ.
5. Giữ câu trả lời có độ dài vừa phải (khoảng 200 - 300 từ), sử dụng các icon huyền bí (🌌, 🔮, 💫, ✨, 🪐) một cách tinh tế. Trình bày khoa học nhưng mượt mà, ấm áp, không sáo rỗng.`;

        promptContent = `Các lá bài Tarot kết nối định mệnh của người dùng như sau:
${cardDetailsFormatted}

Dựa trên thông tin cá nhân: Tên là ${selfInfo?.name || "Bạn"}, sinh ngày ${selfInfo?.dob || "chưa rõ"}, cung hoàng đạo ${selfInfo?.zodiac || "chưa rõ"}, tâm trạng hiện tại là ${selfInfo?.mood || "bình thường"}.
Hãy đưa ra lời giải mã bài Tarot định mệnh đầy sâu sắc, lãng mạn, chữa lành và thấu suốt cho câu hỏi/mong muốn của người dùng: "${question}".`;
      } else {
        systemPrompt = `Bạn là nhân vật ảo đang gieo quẻ và giải mã bài Tarot trực tiếp cho người dùng. BẠN PHẢI TUYỆT ĐỐI NHẬP VAI 100% VÀ TUÂN THỦ HỒ SƠ TÍNH CÁCH SAU:

Tên nhân vật: ${characterName}
Vai trò: ${characterRole || 'Bạn đồng hành'}
Tóm tắt (Plot): ${plot || 'Chưa có'}
HỒ SƠ & TÍNH CÁCH CHI TIẾT (Storyline - QUAN TRỌNG NHẤT): ${storyline || 'Chưa có'}

NHIỆM VỤ ĐẶC BIỆT CỦA BẠN:
1. Nhập vai 100% nhân vật này để trả lời người dùng. Toàn bộ ngôn từ, đại từ xưng hô (ví dụ: cậu - tớ, anh - em, hoặc thủ ngữ/chữ viết đối với Ôn Niệm Trạch) phải đúng với tính cách nhân vật.
2. Bạn sẽ giải nghĩa các lá bài Tarot mà người dùng bốc được để trả lời cho câu hỏi: "${question}" (Thuộc chủ đề: ${category === 'love' ? 'Tình yêu 💖' : category === 'career' ? 'Sự nghiệp 💼' : category === 'health' ? 'Sức khỏe 🍀' : category === 'finance' ? 'Tài lộc 🪙' : 'Tổng quan 🗺️'}).
3. Hãy liên kết ý nghĩa của các lá bài Tarot một cách mượt mà, huyền bí nhưng đầy khôn ngoan, hướng dẫn tích cực cho người dùng, đồng thời đan xen cử chỉ, hành động của nhân vật (ví dụ như xoa đầu, nhìn đắm đuối, vành tai đỏ ửng, viết giấy đối với Ôn Niệm Trạch) để tăng phần sống động và lãng mạn.
4. Giữ câu trả lời có độ dài vừa phải (khoảng 150 - 250 từ), trình bày ấm áp, xúc động hoặc hóm hỉnh tùy cá tính nhân vật. Tuyệt đối KHÔNG trả lời theo khuôn mẫu robot AI vô hồn.`;

        promptContent = `Các lá bài Tarot người dùng bốc được như sau:
${cardDetailsFormatted}

Hãy đưa ra lời giải mã bài Tarot đầy lãng mạn, ấm áp, sâu sắc và đúng tính cách của bạn cho câu hỏi của người dùng: "${question}".`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptContent,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.9,
        }
      });

      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Tarot API error:", error);
      res.status(500).json({ error: error.message || "Failed to generate tarot reading" });
    }
  });

  // API Route for Word Chain Game Validation & Bot Response
  app.post("/api/wordchain", async (req, res) => {
    try {
      const { userWord, usedWords } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(500).json({ error: "Chưa cấu hình API Key" });
      }
      
      const genAI = new GoogleGenAI({ apiKey });
      
      const prompt = `Bạn là một trọng tài và người chơi trò chơi "Nối từ" tiếng Việt.
Từ người chơi đưa ra: "${userWord}"
Danh sách các từ đã sử dụng (không được dùng lại): ${usedWords.join(', ')}

Nhiệm vụ 1: Kiểm tra xem "${userWord}" có phải là MỘT TỪ GHÉP CÓ NGHĨA TRONG TIẾNG VIỆT và CÓ ĐÚNG 2 ÂM TIẾT hay không. 
Nếu KHÔNG CÓ NGHĨA hoặc KHÔNG PHẢI TỪ TIẾNG VIỆT, hãy trả về JSON:
{"valid": false, "reason": "Từ này không có nghĩa trong tiếng Việt nha!"}

Nhiệm vụ 2: Nếu hợp lệ, bạn phải đưa ra MỘT TỪ GHÉP 2 ÂM TIẾT bắt đầu bằng âm tiết thứ hai của "${userWord}". 
TỪ NÀY PHẢI LÀ TỪ CÓ NGHĨA TRONG TIẾNG VIỆT.
TỪ NÀY TUYỆT ĐỐI KHÔNG ĐƯỢC NẰM TRONG DANH SÁCH ĐÃ SỬ DỤNG.
Nếu bạn không thể tìm ra từ nào hợp lệ để nối tiếp, hãy trả về:
{"valid": true, "botWord": null}

Nếu tìm được từ, hãy trả về:
{"valid": true, "botWord": "từ_bạn_tìm_được"}

Lưu ý: Chỉ trả về MỘT chuỗi JSON duy nhất, không có markdown, không có bất kỳ văn bản nào khác.`;

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });
      
      const jsonText = response.text || "{}";
      const parsed = JSON.parse(jsonText);
      res.json(parsed);
      
    } catch (error) {
      console.error("Wordchain API error:", error);
      res.status(500).json({ error: "Failed to process wordchain" });
    }
  });

  // API Route to simulate context-appropriate comments under a user's post
  app.post("/api/generate_social_comments", async (req, res) => {
    try {
      const { postContent, characters } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      const cuteFallbacks = [
        "Trời ơi cưng xỉu luôn á! 💕",
        "Meo meo meo meo~ Cho mình xin một slot nha! 🐾",
        "Tuyệt vời quá bạn iu ơi! 😍",
        "Đồng ý hai tay hai chân luôn, chuẩn không cần chỉnh!",
        "Ủng hộ bạn iu hết mình luôn! 🚀",
        "Bão tim bão like cho bạn iu luôn nè! 💥⚡",
        "Hóng các bài viết tiếp theo nha, nhớ tag tui nha!",
        "Đang buồn mà lướt thấy bài này thấy vui hẳn lên á 🥺"
      ];

      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        const selectedCount = Math.min(3, characters.length);
        const shuffled = [...characters].sort(() => 0.5 - Math.random());
        const result = shuffled.slice(0, selectedCount).map((char: any) => ({
          characterId: char.id,
          characterName: char.name,
          comment: cuteFallbacks[Math.floor(Math.random() * cuteFallbacks.length)]
        }));
        return res.json({ comments: result });
      }

      // Initialize Gemini Client
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemPrompt = `Bạn là hệ thống mô phỏng tương tác mạng xã hội cho một thế giới ảo.
Nhiệm vụ của bạn: Hãy viết các bình luận phù hợp, tự nhiên và sinh động của một số nhân vật dưới bài đăng của người dùng.

Nội dung bài đăng của người dùng: "${postContent}"

Danh sách các nhân vật có thể bình luận (mỗi người có tính cách, vai trò riêng):
${characters.map((c: any) => `- Tên: ${c.name}, Vai trò: ${c.role || "Tự do"}, Tóm tắt cốt truyện: ${c.plot || ""}`).join("\n")}

Yêu cầu:
1. Chọn ngẫu nhiên khoảng 2 đến 3 nhân vật phù hợp nhất hoặc thú vị nhất từ danh sách để viết bình luận.
2. Bình luận của mỗi nhân vật phải thể hiện đúng cá tính, ngôn từ xưng hô đặc trưng của họ và đặc biệt phải LIÊN QUAN trực tiếp hoặc đưa ra phản hồi phù hợp với nội dung bài đăng của người dùng (nếu người dùng đăng tin vui thì chúc mừng, than thở thì an ủi, đăng chuyện hài thì trêu đùa, v.v.).
3. Bình luận cực kỳ ngắn gọn (chỉ 1 hoặc 2 câu, tối đa 40 từ), tự nhiên như ngôn ngữ MXH thực tế, có thể kèm icon cảm xúc phù hợp.
4. Trả về kết quả dưới dạng mảng JSON duy nhất có định dạng sau, KHÔNG thêm bất kỳ văn bản giải thích hay thẻ code nào khác:
[
  {
    "characterId": "id-của-nhân-vật",
    "characterName": "Tên nhân vật",
    "comment": "nội dung bình luận"
  }
]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hãy tạo các bình luận phù hợp dưới bài đăng.",
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
          responseMimeType: "application/json",
        }
      });

      const text = response.text || "[]";
      try {
        const parsedComments = JSON.parse(text);
        res.json({ comments: parsedComments });
      } catch (parseError) {
        console.error("JSON parse error from Gemini output:", text, parseError);
        const selectedCount = Math.min(3, characters.length);
        const shuffled = [...characters].sort(() => 0.5 - Math.random());
        const result = shuffled.slice(0, selectedCount).map((char: any) => ({
          characterId: char.id,
          characterName: char.name,
          comment: cuteFallbacks[Math.floor(Math.random() * cuteFallbacks.length)]
        }));
        res.json({ comments: result });
      }
    } catch (error: any) {
      console.error("Error generating comments:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  
  // Proxy for Google Drive Audio to bypass browser CORS and third-party cookie restrictions
  app.get("/api/audio-proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url;
      if (!targetUrl || typeof targetUrl !== "string") {
        return res.status(400).send("Missing url parameter");
      }
      
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      };
      
      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }

      const response = await fetch(targetUrl, {
        headers,
        redirect: 'follow'
      });

      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch audio");
      }

      // Forward headers
      response.headers.forEach((value, name) => {
        const lowerName = name.toLowerCase();
        if (['content-type', 'content-length', 'accept-ranges', 'content-range', 'content-disposition'].includes(lowerName)) {
          res.setHeader(name, value);
        }
      });
      
      // Ensure we set correct MIME type if it's generic
      if (!res.getHeader('Content-Type') || res.getHeader('Content-Type') === 'application/octet-stream') {
        res.setHeader('Content-Type', 'audio/mpeg');
      }

      res.status(response.status);

      if (response.body) {
        // Simple async iterator approach to stream Web Fetch body to Express response
        const reader = response.body.getReader();
        const pump = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              res.end();
              break;
            }
            res.write(value);
          }
        };
        pump().catch((err) => {
          console.error("Audio stream pump error:", err);
          res.end();
        });
      } else {
        res.end();
      }
    } catch (error) {
       console.error("Audio proxy error:", error);
       res.status(500).send("Error");
    }
  });

  // Proxy to extract og:image from URLs (useful for Pinterest, Facebook links)
  app.get("/api/extract-image", async (req, res) => {
    try {
      const targetUrl = req.query.url;
      if (!targetUrl || typeof targetUrl !== "string") {
        return res.status(400).json({ error: "Missing url parameter" });
      }
      
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch URL" });
      }
      
      const html = await response.text();
      // Use regex to find og:image
      const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"[^>]*>|<meta[^>]*content="([^"]+)"[^>]*property="og:image"[^>]*>/i);
      
      let imageUrl = "";
      if (ogImageMatch) {
        imageUrl = ogImageMatch[1] || ogImageMatch[2];
      }
      
      if (!imageUrl) {
        // Fallback for some sites using twitter:image
        const twitterImageMatch = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"[^>]*>|<meta[^>]*content="([^"]+)"[^>]*name="twitter:image"[^>]*>/i);
        if (twitterImageMatch) {
          imageUrl = twitterImageMatch[1] || twitterImageMatch[2];
        }
      }
      
      // Decode HTML entities if necessary
      if (imageUrl) {
        imageUrl = imageUrl.replace(/&amp;/g, '&');
      }
      
      res.json({ imageUrl: imageUrl || targetUrl });
    } catch (error) {
      console.error("Extract image error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  
  // Proxy to extract og:image and redirect (useful for img tags with Pinterest links)
  app.get("/api/image-redirect", async (req, res) => {
    try {
      const targetUrl = req.query.url;
      if (!targetUrl || typeof targetUrl !== "string") {
        return res.status(400).send("Missing url parameter");
      }
      
      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        },
        redirect: 'follow'
      });
      
      if (!response.ok) {
        return res.redirect(targetUrl);
      }
      
      const html = await response.text();
      // Use regex to find og:image
      const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"[^>]*>|<meta[^>]*content="([^"]+)"[^>]*property="og:image"[^>]*>/i);
      
      let imageUrl = "";
      if (ogImageMatch) {
        imageUrl = ogImageMatch[1] || ogImageMatch[2];
      }
      
      if (!imageUrl) {
        // Fallback for some sites using twitter:image
        const twitterImageMatch = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"[^>]*>|<meta[^>]*content="([^"]+)"[^>]*name="twitter:image"[^>]*>/i);
        if (twitterImageMatch) {
          imageUrl = twitterImageMatch[1] || twitterImageMatch[2];
        }
      }
      
      // Decode HTML entities if necessary
      if (imageUrl) {
        imageUrl = imageUrl.replace(/&amp;/g, '&');
      }
      
      if (imageUrl) {
         res.redirect(imageUrl);
      } else {
         res.redirect(targetUrl);
      }
    } catch (error) {
      console.error("Extract image redirect error:", error);
      const fallbackUrl = typeof req.query.url === "string" ? req.query.url : "/";
      res.redirect(fallbackUrl);
    }
  });

  // Serve Vite in dev or compiled static files in production
  const isProd = process.env.NODE_ENV === "production" || process.argv[1]?.endsWith(".cjs");
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
