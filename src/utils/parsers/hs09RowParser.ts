import type {
  HoSoDieuChinh09Item,
  TtXml1DieuChinhItem,
  ChiPhiDieuChinhItem,
} from "../../types/hs09DieuChinhTypes";
import {
  parseNumberCell,
  parseYmdHmDate,
  DEFAULT_MA_CSKCB,
  escapeXml,
  generateUUID,
} from "../shared";
import { detectScenario } from "../hs09DieuChinhXmlEngine";

/**
 * Chuẩn hóa kỳ quyết toán về định dạng chuẩn YYYYMM (6 ký tự)
 */
export function normalizeKyQt(val: unknown): string {
  if (!val) return "";
  const raw = String(val).trim();
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length === 6) {
    const p1 = Number(digits.slice(0, 2));
    const p2 = Number(digits.slice(2));
    // Nếu dạng MMYYYY (tháng 01-12, năm >= 2000) -> đảo về YYYYMM
    if (p1 >= 1 && p1 <= 12 && p2 >= 2000) {
      return `${p2}${String(p1).padStart(2, "0")}`;
    }
    return digits;
  }
  if (digits.length >= 8) {
    // Nếu là YYYYMMDD -> lấy YYYYMM
    return digits.slice(0, 6);
  }
  return raw;
}

/**
 * Chuyển đổi một dòng thô Excel thành đối tượng HoSoDieuChinh09Item
 * Giữ nguyên dữ liệu từ file Excel, không tự ý điền dữ liệu giả khi ô trống.
 */
export function parseHs09Row(
  rowObj: Record<string, unknown>,
  rowIndex: number,
  autoStt: number,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): HoSoDieuChinh09Item | null {
  const maLk = String(rowObj["MA_LK"] ?? "").trim();
  const hoTen = String(rowObj["HO_TEN"] ?? "").trim();
  const maBn = String(rowObj["MA_BN"] ?? "").trim();
  const maThe = String(rowObj["MA_THE"] ?? "").trim();

  // Bỏ qua dòng trống không có MA_LK hoặc HO_TEN
  if (!maLk && !hoTen) {
    return null;
  }

  const stt = parseNumberCell(rowObj["STT"], autoStt);
  const xml1Id = String(rowObj["XML1_ID"] ?? "").trim();
  const ngayVao = parseYmdHmDate(rowObj["NGAY_VAO"]) || "";
  const ngayRa = parseYmdHmDate(rowObj["NGAY_RA"]) || "";
  const kyQt = normalizeKyQt(rowObj["KY_QT"]);
  const trangThaiHs = parseNumberCell(rowObj["TRANGTHAI_HS"], 1);

  const soBangXml = parseNumberCell(rowObj["SOBANG_XML"], 0);
  const truongTtGoc = String(rowObj["TRUONG_TT_GOC"] ?? "").trim();
  const ttGoc = String(rowObj["TT_GOC"] ?? "").trim();
  const truongTtDieuChinh = String(rowObj["TRUONG_TT_DIEUCHINH"] ?? "").trim();
  const ttDieuChinh = String(rowObj["TT_DIEUCHINH"] ?? "").trim();
  const lyDoDieuChinh = String(rowObj["LYDO_DIEUCHINH"] ?? "").trim();
  const tuChoi = String(rowObj["TUCHOI"] ?? "").trim() || undefined;
  const lyDo = String(rowObj["LYDO"] ?? "").trim() || undefined;
  const tienXuatToan = parseNumberCell(rowObj["TIEN_XUAT_TOAN"], 0);
  const tienDeNghi = parseNumberCell(
    rowObj["TIEN_DE_NGHI"] ?? rowObj["TIEN_DENGHI"] ?? rowObj["TIEN_XUAT_TOAN"],
    tienXuatToan,
  );

  const dsXml1DieuChinh: TtXml1DieuChinhItem[] = [];
  const dsChiPhiDieuChinh: ChiPhiDieuChinhItem[] = [];

  // Phân loại dòng điều chỉnh XML1 hay Chi phí
  if (
    soBangXml <= 1 &&
    (truongTtGoc || ttDieuChinh || truongTtDieuChinh || ttGoc || lyDoDieuChinh)
  ) {
    dsXml1DieuChinh.push({
      stt: 1,
      truongTtGoc,
      ttGoc,
      truongTtDieuChinh: truongTtDieuChinh || truongTtGoc,
      ttDieuChinh,
      lyDoDieuChinh,
    });
  } else if (soBangXml >= 2) {
    const idCp = String(rowObj["ID_CP"] ?? "").trim();
    const sttXml = parseNumberCell(rowObj["STT_XML"], 0);
    const ngayYl = parseYmdHmDate(rowObj["NGAY_YL"]) || "";

    dsChiPhiDieuChinh.push({
      stt: 1,
      soBangXml,
      idCp,
      sttXml,
      ngayYl,
      trangThai: trangThaiHs,
      truongTtGoc,
      ttGoc,
      lyDo,
      tuChoi,
      truongTtDieuChinh: truongTtDieuChinh || truongTtGoc,
      ttDieuChinh,
      lyDoDieuChinh,
    });
  }

  const errors: string[] = [];
  if (!maLk) errors.push("Thiếu mã liên kết (MA_LK)");
  if (!hoTen) errors.push("Thiếu họ tên bệnh nhân (HO_TEN)");
  if (!maThe) errors.push("Thiếu mã thẻ BHYT (MA_THE)");
  
  // KB 4: Cho phép cả 2 DS rỗng khi TRANGTHAI_HS là 1 (Thu hồi) hoặc 4 (Xin ý kiến)
  if (
    dsXml1DieuChinh.length === 0 &&
    dsChiPhiDieuChinh.length === 0 &&
    trangThaiHs !== 1 &&
    trangThaiHs !== 4
  ) {
    errors.push("Chưa có thông tin dòng điều chỉnh XML1 hoặc chi phí");
  }

  // Validate LYDO_DIEUCHINH bắt buộc cho các dòng có điều chỉnh
  if (dsXml1DieuChinh.some((dc) => !dc.lyDoDieuChinh)) {
    errors.push("Dòng điều chỉnh XML1 thiếu lý do điều chỉnh (LYDO_DIEUCHINH)");
  }
  if (dsChiPhiDieuChinh.some((cp) => !cp.lyDoDieuChinh)) {
    errors.push("Mục chi phí điều chỉnh thiếu lý do điều chỉnh (LYDO_DIEUCHINH)");
  }

  const rawKhoa = String(
    rowObj["KHOA_DIEU_TRI"] ?? rowObj["KHOA"] ?? rowObj["TEN_KHOA"] ?? "",
  ).trim();
  const khoaDieuTri = rawKhoa || undefined;

  const rawNguoiGiaiTrinh = String(
    rowObj["NGUOI_GIAI_TRINH"] ??
      rowObj["MACCHN"] ??
      rowObj["SO_DINH_DANH"] ??
      rowObj["MA_BS"] ??
      rowObj["NGUOILAPBIEU"] ??
      rowObj["BAC_SI"] ??
      "",
  ).trim();
  const nguoiGiaiTrinh = rawNguoiGiaiTrinh || undefined;

  const ngayGiaiTrinh =
    parseYmdHmDate(rowObj["NGAY_GIAI_TRINH"]) ||
    String(rowObj["NGAY_GIAI_TRINH"] ?? rowObj["NGAYTHANGNAM"] ?? "").trim() ||
    undefined;
  const nhomLoi =
    String(rowObj["NHOM_LOI"] ?? (tuChoi || "")).trim() || undefined;

  const nguoiLapBieu = String(
    rowObj["NGUOILAPBIEU"] ?? nguoiGiaiTrinh ?? "",
  ).trim();
  const thuTruongDv = String(rowObj["THUTRUONG_DV"] ?? "").trim();
  const ngayThangNam = String(
    rowObj["NGAYTHANGNAM"] ?? ngayGiaiTrinh ?? "",
  ).trim();

  return {
    id: `hs09-${Date.now()}-${rowIndex}-${Math.random().toString(36).substring(2, 6)}`,
    stt,
    ttMau: {
      mauSo: "09/BH",
      maCskcb:
        String(rowObj["MA_CSKCB"] ?? defaultMaCskcb).trim() || defaultMaCskcb,
      nguoiLapBieu,
      thuTruongDv,
      ngayThangNam,
    },
    ttXml1: {
      xml1Id,
      maLk,
      maBn,
      hoTen,
      maThe,
      ngayVao,
      ngayRa,
      kyQt,
      trangThai: trangThaiHs,
    },
    dsXml1DieuChinh,
    dsChiPhiDieuChinh,
    khoaDieuTri,
    nhomLoi,
    nguoiGiaiTrinh,
    ngayGiaiTrinh,
    tienXuatToan,
    tienDeNghiThanhToanLai: tienDeNghi,
    trangThai: "cho_xu_ly",
    ttKySo: 0,
    tinhTrangGui: 0,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Render 1 item HoSoDieuChinh09Item thành khối XML <TT_HOSO>
 * Giữ nguyên các giá trị rỗng/trống dưới dạng thẻ đóng rỗng <TAG/>
 */
export function renderHs09ItemXml(
  item: HoSoDieuChinh09Item,
  defaultMaCskcb = DEFAULT_MA_CSKCB,
): string {
  const containerId = `Id-${generateUUID()}`;
  const cskcb = item.ttMau.maCskcb || defaultMaCskcb;
  const scenario = detectScenario(item);

  /**
   * TRANGTHAI tại <TT_XML1>:
   * - KB 1/2/3 (có danh sách điều chỉnh): luôn là 2 (điều chỉnh dữ liệu gốc)
   * - KB 4 (cả hai rỗng): dùng giá trị từ item: 1=Thu hồi, 4=Xin ý kiến
   */
  const xml1TrangThai = scenario === 'ThuHoi_Hoac_XinYK'
    ? (item.ttXml1.trangThai || 1)
    : 2;

  const tagOrEmpty = (tag: string, val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === "") {
      return `<${tag}/>`;
    }
    return `<${tag}>${escapeXml(val)}</${tag}>`;
  };

  // 1. XML1 Điều Chỉnh
  let dsXml1DcXml = "      <DS_XML1_DIEUCHINH/>";
  if (item.dsXml1DieuChinh && item.dsXml1DieuChinh.length > 0) {
    const rows = item.dsXml1DieuChinh
      .map(
        (dc: TtXml1DieuChinhItem, idx: number) => `        <TT_XML1_DC>
          <STT>${dc.stt || idx + 1}</STT>
          ${tagOrEmpty("TRUONG_TT_GOC", dc.truongTtGoc)}
          ${tagOrEmpty("TT_GOC", dc.ttGoc)}
          ${tagOrEmpty("TRUONG_TT_DIEUCHINH", dc.truongTtDieuChinh || dc.truongTtGoc)}
          ${tagOrEmpty("TT_DIEUCHINH", dc.ttDieuChinh)}
          ${tagOrEmpty("LYDO_DIEUCHINH", dc.lyDoDieuChinh)}
        </TT_XML1_DC>`,
      )
      .join("");
    dsXml1DcXml = `      <DS_XML1_DIEUCHINH>\n${rows}\n      </DS_XML1_DIEUCHINH>`;
  }

  // 2. Chi Phí Điều Chỉnh
  // CHIPHI.TRANGTHAI: 2 = Sửa thông tin, 1 = Thu hồi riêng dòng này
  let dsCpDcXml = "      <DSCP_DIEUCHINH/>";
  if (item.dsChiPhiDieuChinh && item.dsChiPhiDieuChinh.length > 0) {
    const rows = item.dsChiPhiDieuChinh
      .map(
        (cp: ChiPhiDieuChinhItem, idx: number) => `        <CHIPHI>
          <STT>${cp.stt || idx + 1}</STT>
          <SOBANG_XML>${cp.soBangXml || 0}</SOBANG_XML>
          ${tagOrEmpty("ID_CP", cp.idCp)}
          <STT_XML>${cp.sttXml || 0}</STT_XML>
          ${tagOrEmpty("NGAY_YL", cp.ngayYl)}
          <TRANGTHAI>${cp.trangThai || 2}</TRANGTHAI>
          ${tagOrEmpty("TRUONG_TT_GOC", cp.truongTtGoc)}
          ${tagOrEmpty("TT_GOC", cp.ttGoc)}
          ${tagOrEmpty("LYDO", cp.lyDo)}
          ${tagOrEmpty("TUCHOI", cp.tuChoi)}
          ${tagOrEmpty("TRUONG_TT_DIEUCHINH", cp.truongTtDieuChinh || cp.truongTtGoc)}
          ${tagOrEmpty("TT_DIEUCHINH", cp.ttDieuChinh)}
          ${tagOrEmpty("LYDO_DIEUCHINH", cp.lyDoDieuChinh)}
        </CHIPHI>`,
      )
      .join("");
    dsCpDcXml = `      <DSCP_DIEUCHINH>\n${rows}\n      </DSCP_DIEUCHINH>`;
  }

  return `  <TT_HOSO Id="${containerId}">
    <TT_MAU>
      <MAU_SO>09/BH</MAU_SO>
      <MA_CSKCB>${escapeXml(cskcb)}</MA_CSKCB>
      ${tagOrEmpty("NGUOILAPBIEU", item.ttMau.nguoiLapBieu)}
      ${tagOrEmpty("THUTRUONG_DV", item.ttMau.thuTruongDv)}
      ${tagOrEmpty("NGAYTHANGNAM", item.ttMau.ngayThangNam)}
    </TT_MAU>
    <TT_XML1>
      ${tagOrEmpty("XML1_ID", item.ttXml1.xml1Id)}
      ${tagOrEmpty("MA_LK", item.ttXml1.maLk)}
      ${tagOrEmpty("MA_BN", item.ttXml1.maBn)}
      ${tagOrEmpty("HO_TEN", item.ttXml1.hoTen)}
      ${tagOrEmpty("MA_THE", item.ttXml1.maThe)}
      ${tagOrEmpty("NGAY_VAO", item.ttXml1.ngayVao)}
      ${tagOrEmpty("NGAY_RA", item.ttXml1.ngayRa)}
      ${tagOrEmpty("KY_QT", normalizeKyQt(item.ttXml1.kyQt))}
      <TRANGTHAI>${xml1TrangThai}</TRANGTHAI>
    </TT_XML1>
    <TT_DIEUCHINH>
${dsXml1DcXml}
${dsCpDcXml}
    </TT_DIEUCHINH>
  </TT_HOSO>`;
}
