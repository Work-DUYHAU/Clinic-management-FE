import mammoth from 'mammoth';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface DocxParseResult {
  html: string;
  rawText: string;
  pdfBlob: Blob;
  pdfFile: File;
}

/**
 * Đọc file .docx bằng mammoth, trích xuất HTML và sinh file PDF tương ứng
 */
export async function parseDocxAndConvertToPdf(file: File): Promise<DocxParseResult> {
  const arrayBuffer = await file.arrayBuffer();

  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer }),
  ]);

  const html = htmlResult.value || '';
  const rawText = textResult.value || '';

  // Tạo PDF văn bản từ nội dung DOCX bằng pdf-lib để đi chung luồng preview & ký số PDF
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Tạo trang A4 chuẩn (595.28 x 841.89 pt)
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Header tiêu chuẩn
  page.drawText('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', {
    x: width / 2 - 130,
    y: height - 50,
    size: 11,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText('Độc lập - Tự do - Hạnh phúc', {
    x: width / 2 - 75,
    y: height - 66,
    size: 10,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  // Tên tài liệu
  page.drawText(file.name.replace(/\.[^/.]+$/, ''), {
    x: 50,
    y: height - 100,
    size: 12,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
  });

  // Vẽ các dòng nội dung text
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
  let curY = height - 130;
  const maxLines = Math.min(lines.length, 30);

  for (let i = 0; i < maxLines; i++) {
    const line = lines[i].trim().slice(0, 95);
    page.drawText(line, {
      x: 50,
      y: curY,
      size: 9.5,
      font: timesRomanFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    curY -= 18;
    if (curY < 120) break;
  }

  // Khối chữ ký ở đáy trang: THỦ TRƯỞNG ĐƠN VỊ
  page.drawText('THỦ TRƯỞNG ĐƠN VỊ', {
    x: width - 200,
    y: 110,
    size: 11,
    font: timesBoldFont,
    color: rgb(0, 0, 0),
  });
  page.drawText('(Ký, họ tên, đóng dấu)', {
    x: width - 190,
    y: 95,
    size: 9,
    font: timesRomanFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const pdfFileName = file.name.replace(/\.[^/.]+$/, '') + '.pdf';
  const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

  return {
    html,
    rawText,
    pdfBlob,
    pdfFile,
  };
}
