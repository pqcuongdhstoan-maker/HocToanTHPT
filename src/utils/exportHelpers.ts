import { Lesson, Question, ExamMatrix } from "../types";

/**
 * Downloads a file to the user's computer
 */
function triggerBrowserDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1. SKILL: docx-official
 * Exports an exam to a beautifully styled Word Document (.doc/.docx compatible)
 * with school header, exam title, 4 standard GDPT 2018 parts, answer key, and detailed solutions.
 */
export function exportExamToWordDocx(
  examTitle: string,
  questions: Question[],
  grade: number = 12,
  timeMinutes: number = 45
) {
  const sanitize = (str: string = "") =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\n/g, "<br/>");

  const part1Questions = questions.filter((q) => q.partType === "PART_I");
  const part2Questions = questions.filter((q) => q.partType === "PART_II");
  const part3Questions = questions.filter((q) => q.partType === "PART_III");
  const part4Questions = questions.filter((q) => q.partType === "PART_IV");

  let bodyHtml = `
    <div style="font-family: 'Times New Roman', serif; line-height: 1.4; color: #111; max-width: 800px; margin: auto;">
      <!-- Header Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <p style="font-size: 13pt; margin: 0; text-transform: uppercase;">SỞ GIÁO DỤC VÀ ĐÀO TẠO</p>
            <p style="font-size: 13pt; margin: 0; font-weight: bold; text-transform: uppercase;">TRƯỜNG THPT CHUYÊN</p>
            <p style="font-size: 11pt; margin: 4px 0 0 0; font-style: italic;">Giáo viên: Thầy Phan Quốc Cường</p>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <p style="font-size: 14pt; margin: 0; font-weight: bold; text-transform: uppercase; color: #1d4ed8;">
              ĐỀ KIỂM TRA TOÁN ${grade}
            </p>
            <p style="font-size: 12pt; margin: 0; font-weight: bold;">CHƯƠNG TRÌNH GDPT 2018</p>
            <p style="font-size: 11pt; margin: 4px 0 0 0; font-style: italic;">Thời gian làm bài: ${timeMinutes} phút (không kể phát đề)</p>
          </td>
        </tr>
      </table>

      <!-- Topic Title -->
      <div style="text-align: center; margin: 15px 0; border-bottom: 2px solid #333; padding-bottom: 8px;">
        <h2 style="font-size: 15pt; margin: 0; font-weight: bold; text-transform: uppercase;">
          ${sanitize(examTitle)}
        </h2>
        <p style="font-size: 11pt; margin: 4px 0 0 0;">
          (Họ và tên thí sinh: .............................................................. Số báo danh: ............)
        </p>
      </div>
  `;

  // PHẦN I
  if (part1Questions.length > 0) {
    bodyHtml += `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 13pt; font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #93c5fd; padding-bottom: 4px;">
          PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (${part1Questions.length} câu)
        </h3>
        <p style="font-size: 11pt; font-style: italic; margin: 4px 0 12px 0;">
          Thí sinh trả lời từ câu 1 đến câu ${part1Questions.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
        </p>
    `;

    part1Questions.forEach((q, idx) => {
      bodyHtml += `
        <div style="margin-bottom: 14px; page-break-inside: avoid;">
          <p style="font-size: 12pt; margin: 0 0 6px 0;">
            <strong>Câu ${idx + 1}:</strong> ${sanitize(q.content)}
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-left: 15px;">
            <tr>
              ${(q.options || [])
                .map(
                  (opt) =>
                    `<td style="width: 25%; font-size: 12pt; padding: 3px 0; vertical-align: top;">
                      <strong>${opt.id}.</strong> ${sanitize(opt.text)}
                    </td>`
                )
                .join("")}
            </tr>
          </table>
        </div>
      `;
    });
    bodyHtml += `</div>`;
  }

  // PHẦN II
  if (part2Questions.length > 0) {
    bodyHtml += `
      <div style="margin-top: 25px;">
        <h3 style="font-size: 13pt; font-weight: bold; color: #4338ca; border-bottom: 1px solid #c7d2fe; padding-bottom: 4px;">
          PHẦN II. Câu trắc nghiệm đúng sai (${part2Questions.length} câu)
        </h3>
        <p style="font-size: 11pt; font-style: italic; margin: 4px 0 12px 0;">
          Thí sinh trả lời từng câu. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
        </p>
    `;

    part2Questions.forEach((q, idx) => {
      bodyHtml += `
        <div style="margin-bottom: 16px; page-break-inside: avoid;">
          <p style="font-size: 12pt; margin: 0 0 6px 0;">
            <strong>Câu ${idx + 1}:</strong> ${sanitize(q.content)}
          </p>
          <div style="margin-left: 20px;">
            ${(q.tfStatements || [])
              .map(
                (stmt) =>
                  `<p style="font-size: 12pt; margin: 3px 0;">
                    <strong>${stmt.id})</strong> ${sanitize(stmt.statement)}
                  </p>`
              )
              .join("")}
          </div>
        </div>
      `;
    });
    bodyHtml += `</div>`;
  }

  // PHẦN III
  if (part3Questions.length > 0) {
    bodyHtml += `
      <div style="margin-top: 25px;">
        <h3 style="font-size: 13pt; font-weight: bold; color: #6b21a8; border-bottom: 1px solid #e9d5ff; padding-bottom: 4px;">
          PHẦN III. Câu trắc nghiệm trả lời ngắn (${part3Questions.length} câu)
        </h3>
        <p style="font-size: 11pt; font-style: italic; margin: 4px 0 12px 0;">
          Thí sinh trả lời kết quả số hoặc biểu thức tối giản theo yêu cầu.
        </p>
    `;

    part3Questions.forEach((q, idx) => {
      bodyHtml += `
        <div style="margin-bottom: 14px; page-break-inside: avoid;">
          <p style="font-size: 12pt; margin: 0;">
            <strong>Câu ${idx + 1}:</strong> ${sanitize(q.content)}
          </p>
        </div>
      `;
    });
    bodyHtml += `</div>`;
  }

  // PHẦN IV
  if (part4Questions.length > 0) {
    bodyHtml += `
      <div style="margin-top: 25px;">
        <h3 style="font-size: 13pt; font-weight: bold; color: #9a3412; border-bottom: 1px solid #fed7aa; padding-bottom: 4px;">
          PHẦN IV. Tự luận & Mô hình hóa (${part4Questions.length} câu)
        </h3>
    `;

    part4Questions.forEach((q, idx) => {
      bodyHtml += `
        <div style="margin-bottom: 16px; page-break-inside: avoid;">
          <p style="font-size: 12pt; margin: 0 0 6px 0;">
            <strong>Câu ${idx + 1}:</strong> ${sanitize(q.content)}
          </p>
        </div>
      `;
    });
    bodyHtml += `</div>`;
  }

  // ĐÁP ÁN & LỜI GIẢI CHI TIẾT
  bodyHtml += `
    <div style="page-break-before: always; margin-top: 40px; border-top: 2px dashed #666; padding-top: 20px;">
      <h2 style="text-align: center; font-size: 15pt; font-weight: bold; text-transform: uppercase; color: #166534;">
        HƯỚNG DẪN CHẤM & LỜI GIẢI CHI TIẾT
      </h2>
      <p style="text-align: center; font-size: 11pt; font-style: italic;">
        Biên soạn: Thầy Phan Quốc Cường • Chuẩn ma trận GDPT 2018
      </p>

      <!-- Bảng đáp án Phần I -->
      ${
        part1Questions.length > 0
          ? `
        <h4 style="font-size: 12pt; font-weight: bold; margin: 15px 0 6px 0;">1. BẢNG ĐÁP ÁN PHẦN I</h4>
        <table style="width: 100%; border: 1px solid #333; border-collapse: collapse; text-align: center; font-size: 11pt;">
          <tr style="background-color: #f3f4f6;">
            ${part1Questions.map((_, i) => `<th style="border: 1px solid #333; padding: 4px;">Câu ${i + 1}</th>`).join("")}
          </tr>
          <tr>
            ${part1Questions.map((q) => `<td style="border: 1px solid #333; padding: 4px; font-weight: bold; color: #1e3a8a;">${q.correctOption || "-"}</td>`).join("")}
          </tr>
        </table>
      `
          : ""
      }

      <!-- Lời giải chi tiết từng câu -->
      <h4 style="font-size: 12pt; font-weight: bold; margin: 20px 0 8px 0;">2. LỜI GIẢI CHI TIẾT TỪNG BƯỚC</h4>
  `;

  questions.forEach((q, idx) => {
    bodyHtml += `
      <div style="margin-bottom: 14px; padding: 10px; background-color: #f8fafc; border-left: 3px solid #3b82f6; page-break-inside: avoid;">
        <p style="font-size: 11pt; font-weight: bold; margin: 0 0 4px 0; color: #1e40af;">
          Câu ${idx + 1} [${q.cognitiveLevel || "Thông hiểu"}] (${q.topicTag || "Toán THPT"}):
        </p>
        <p style="font-size: 11pt; margin: 0; line-height: 1.5;">
          ${sanitize(q.standardSolution || "Xem phương pháp giải chuẩn SGK.")}
        </p>
      </div>
    `;
  });

  bodyHtml += `
      <p style="text-align: center; font-size: 12pt; font-weight: bold; margin-top: 30px;">
        ---------- HẾT ----------
      </p>
    </div>
  </div>`;

  const fullDocument = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${examTitle}</title>
        <style>
          @page Section1 { size: 595.3pt 841.9pt; margin: 56.7pt 56.7pt 56.7pt 56.7pt; mso-header-margin: 35.4pt; mso-footer-margin: 35.4pt; mso-paper-source: 0; }
          div.Section1 { page: Section1; }
          body { font-family: 'Times New Roman', serif; }
        </style>
      </head>
      <body>
        <div class="Section1">
          ${bodyHtml}
        </div>
      </body>
    </html>
  `;

  const fileName = `De_Thi_${examTitle.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, "_")}.doc`;
  triggerBrowserDownload(fileName, fullDocument, "application/msword");
}

/**
 * 2. SKILL: pptx-official
 * Generates an interactive PowerPoint-style slide HTML deck ready for projection on smart boards.
 */
export function exportExamToPresentationSlides(
  examTitle: string,
  questions: Question[],
  teacherName: string = "Thầy Phan Quốc Cường"
) {
  const sanitize = (str: string = "") =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");

  const slidesHtml = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Slide Bài Giảng: ${sanitize(examTitle)}</title>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
    .slide-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 30px; position: relative; }
    .slide { display: none; width: 100%; max-width: 1000px; background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 40px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .slide.active { display: block; animation: fadeIn 0.3s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .nav-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 30px; background: #1e293b; border-top: 1px solid #334155; }
    .btn { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    .btn:hover { background: #2563eb; }
    .tag { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; background: #3b82f6; margin-bottom: 12px; }
    .solution-box { display: none; margin-top: 20px; padding: 20px; background: #0f172a; border-left: 4px solid #10b981; border-radius: 12px; }
    .solution-box.show { display: block; }
  </style>
</head>
<body>
  <div class="slide-container">
    <!-- Slide 0: Title -->
    <div class="slide active">
      <div style="text-align: center; padding: 40px 0;">
        <span class="tag" style="background: #eab308; color: #0f172a;">GDPT 2018 • TOÁN THPT</span>
        <h1 style="font-size: 36px; margin: 20px 0; color: #60a5fa;">${sanitize(examTitle)}</h1>
        <p style="font-size: 20px; color: #94a3b8;">Giáo viên giảng dạy: <strong>${teacherName}</strong></p>
        <p style="font-size: 16px; color: #64748b; margin-top: 30px;">Tổng số: ${questions.length} câu hỏi • Sử dụng mũi tên Trái / Phải để chuyển slide</p>
      </div>
    </div>

    <!-- Question Slides -->
    ${questions
      .map(
        (q, idx) => `
      <div class="slide">
        <span class="tag">${q.partType} • ${q.cognitiveLevel || "Thông hiểu"}</span>
        <h2 style="font-size: 22px; line-height: 1.5; margin-bottom: 20px;">
          <strong>Câu ${idx + 1}:</strong> ${sanitize(q.content)}
        </h2>

        ${
          q.options
            ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0;">
            ${q.options
              .map(
                (opt) => `
              <div style="padding: 12px 16px; background: #334155; border-radius: 12px; font-size: 16px;">
                <strong style="color: #60a5fa;">${opt.id}.</strong> ${sanitize(opt.text)}
              </div>`
              )
              .join("")}
          </div>`
            : ""
        }

        ${
          q.tfStatements
            ? `
          <div style="margin: 15px 0;">
            ${q.tfStatements
              .map(
                (stmt) => `
              <div style="padding: 10px 14px; background: #334155; border-radius: 10px; margin-bottom: 8px;">
                <strong>${stmt.id})</strong> ${sanitize(stmt.statement)}
              </div>`
              )
              .join("")}
          </div>`
            : ""
        }

        <div style="margin-top: 20px;">
          <button class="btn" style="background: #10b981;" onclick="toggleSolution(${idx})">
            💡 Hiện / Ẩn Đáp Án & Lời Giải
          </button>
        </div>

        <div id="sol_${idx}" class="solution-box">
          <p style="font-weight: bold; color: #34d399; margin-bottom: 8px;">
            ${q.correctOption ? `Đáp án đúng: ${q.correctOption}` : "Lời giải chi tiết:"}
          </p>
          <div style="font-size: 15px; line-height: 1.6;">${sanitize(q.standardSolution)}</div>
        </div>
      </div>
    `
      )
      .join("")}
  </div>

  <div class="nav-bar">
    <button class="btn" onclick="prevSlide()">❮ Slide Trước</button>
    <span id="slide_indicator" style="font-weight: bold; color: #94a3b8;">Slide 1 / ${questions.length + 1}</span>
    <button class="btn" onclick="nextSlide()">Slide Tiếp ❯</button>
  </div>

  <script>
    let cur = 0;
    const slides = document.querySelectorAll('.slide');
    const indicator = document.getElementById('slide_indicator');

    function showSlide(n) {
      slides.forEach(s => s.classList.remove('active'));
      cur = (n + slides.length) % slides.length;
      slides[cur].classList.add('active');
      indicator.textContent = 'Slide ' + (cur + 1) + ' / ' + slides.length;
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
      }
    }

    function nextSlide() { showSlide(cur + 1); }
    function prevSlide() { showSlide(cur - 1); }

    function toggleSolution(idx) {
      const el = document.getElementById('sol_' + idx);
      if (el) el.classList.toggle('show');
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    });
  </script>
</body>
</html>
  `;

  const fileName = `Slide_Trinh_Chieu_${examTitle.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, "_")}.html`;
  triggerBrowserDownload(fileName, slidesHtml, "text/html");
}

/**
 * 3. SKILL: moodle-external-api-development
 * Exports question bank to universal GIFT format (imported into Moodle, Azota, Shub Classroom, Subiz)
 */
export function exportQuestionsToMoodleGift(
  examTitle: string,
  questions: Question[]
) {
  let giftOutput = `// Đề thi: ${examTitle}\n// Thầy Phan Quốc Cường - GDPT 2018\n\n`;

  questions.forEach((q, idx) => {
    const titleClean = `::Câu ${idx + 1} [${q.cognitiveLevel || "TH"}]::`;
    const contentClean = q.content.replace(/[{}=~#]/g, "\\$&");

    if (q.partType === "PART_I" && q.options) {
      // Multiple choice GIFT format: { =A ~B ~C ~D }
      const optionsGift = q.options
        .map((opt) => {
          const isCorrect = opt.id === q.correctOption;
          const optClean = opt.text.replace(/[{}=~#]/g, "\\$&");
          return `${isCorrect ? "=" : "~"}${opt.id}. ${optClean}`;
        })
        .join(" ");

      giftOutput += `${titleClean} ${contentClean} {\n  ${optionsGift}\n}\n\n`;
    } else if (q.partType === "PART_II" && q.tfStatements) {
      // True / False individual statements
      q.tfStatements.forEach((stmt) => {
        giftOutput += `::Câu ${idx + 1}.${stmt.id}:: ${contentClean} - Ý ${stmt.id}: ${stmt.statement.replace(/[{}=~#]/g, "\\$&")} {${stmt.isCorrect ? "TRUE" : "FALSE"}}\n`;
      });
      giftOutput += "\n";
    } else if (q.partType === "PART_III" && q.shortAnswerCorrect) {
      // Short Answer format: { =4.5 }
      giftOutput += `${titleClean} ${contentClean} { =${q.shortAnswerCorrect.trim()} }\n\n`;
    } else {
      // Essay format: { }
      giftOutput += `${titleClean} ${contentClean} { }\n\n`;
    }
  });

  const fileName = `Ngan_Hang_Cau_Hoi_${examTitle.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, "_")}.gift.txt`;
  triggerBrowserDownload(fileName, giftOutput, "text/plain;charset=utf-8");
}
