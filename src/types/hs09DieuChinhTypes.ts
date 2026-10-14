/**
 * Thông tin biểu mẫu (Mục 5: TT_MAU trong XML <HOSO_DIEUCHINH_GD>)
 */
export interface TtMauInfo {
  mauSo: string; // MAU_SO (mặc định "09/BH")
  maCskcb: string; // MA_CSKCB (mã 5 ký tự, vd: "49939")
  nguoiLapBieu: string; // NGUOILAPBIEU
  thuTruongDv: string; // THUTRUONG_DV
  ngayThangNam: string; // NGAYTHANGNAM (định dạng YYYYMMDD)
}

/**
 * Thông tin hồ sơ XML1 gốc (Mục 6: TT_XML1)
 */
export interface TtXml1Info {
  xml1Id: string | number; // XML1_ID (Số 18)
  maLk: string; // MA_LK (Mã liên kết hồ sơ)
  maBn: string; // MA_BN (Mã bệnh nhân)
  hoTen: string; // HO_TEN (Họ tên bệnh nhân)
  maThe: string; // MA_THE (Mã thẻ BHYT 15 ký tự)
  ngayVao: string; // NGAY_VAO (12 ký tự YYYYMMDDHHmm)
  ngayRa: string; // NGAY_RA (12 ký tự YYYYMMDDHHmm)
  kyQt: string; // KY_QT (6 ký tự YYYYMM)
  trangThai: number; // TRANGTHAI (1: Thu hồi, 2: Điều chỉnh dữ liệu gốc, 4: Xin ý kiến)

  // Thông tin hành chính gốc bổ sung (theo Phụ lục I TT 12/2026/TT-BTC Mục 3.1)
  ngaySinh?: string; // NGAY_SINH (YYYYMMDD)
  gioiTinh?: number; // 1: Nam, 2: Nữ
  maDkbd?: string; // MA_DKBD
  maBenhChinh?: string; // MA_BENH_CHINH
  lyDoTuChoi?: string; // Lý do từ chối tự động của BHXH
  tinhTrangDuyet?: number; // 0: Chưa duyệt, 1: Đã duyệt, 2: Từ chối
}

/**
 * Dòng điều chỉnh thông tin hành chính XML1 (Mục 7.1: TT_XML1_DC)
 */
export interface TtXml1DieuChinhItem {
  stt: number; // STT dòng điều chỉnh
  truongTtGoc: string; // TRUONG_TT_GOC: Tên trường sai trong XML1 (vd: MA_BENH_CHINH, HO_TEN, NGAY_RA...)
  ttGoc: string; // TT_GOC: Giá trị ban đầu
  truongTtDieuChinh: string; // TRUONG_TT_DIEUCHINH: Tên trường sau điều chỉnh
  ttDieuChinh: string; // TT_DIEUCHINH: Giá trị sau điều chỉnh
  lyDoDieuChinh: string; // LYDO_DIEUCHINH: Lý do điều chỉnh
}

/**
 * Dòng điều chỉnh chi phí XML2/3/4 (Mục 7.2: CHIPHI trong DSCP_DIEUCHINH)
 */
export interface ChiPhiDieuChinhItem {
  stt: number; // STT dòng
  soBangXml: number; // SOBANG_XML (2: XML2 - Thuốc, 3: XML3 - DVKT/VTYT, 4: XML4 - CLS, 5: XML5 - Diễn biến)
  idCp: string | number; // ID_CP: ID chi phí (Số 18)
  sttXml: number; // STT_XML: STT dòng trong XML gốc
  ngayYl: string; // NGAY_YL: Ngày y lệnh (12 ký tự YYYYMMDDHHmm hoặc số)
  trangThai: number; // TRANGTHAI tại CHIPHI: 1=Thu hồi riêng dòng này, 2=Sửa thông tin chi phí, 4=Xin ý kiến
  truongTtGoc?: string; // TRUONG_TT_GOC: Trường sai của chi phí (vd: DON_GIA, SO_LUONG, MA_DICH_VU...)
  ttGoc?: string; // TT_GOC: Giá trị ban đầu
  lyDo?: string; // LYDO: Lý do từ chối của BHXH
  tuChoi?: string; // TUCHOI: Mã lỗi / Nội dung từ chối
  truongTtDieuChinh?: string; // TRUONG_TT_DIEUCHINH: Trường điều chỉnh
  ttDieuChinh?: string; // TT_DIEUCHINH: Giá trị mới
  lyDoDieuChinh: string; // LYDO_DIEUCHINH: Lý do cơ sở KCB điều chỉnh giải trình
  tinhTrangDuyet?: number; // 0: Chưa duyệt, 1: Đã duyệt, 2: Từ chối (Mục 3.2 TT 12/2026/TT-BTC)
  trangThaiKySo?: number; // 0: Chưa ký số, 2: Đã ký số
  gdDuyet?: number; // 0: Chưa xử lý, 1: Đang xử lý, 2: Đã xử lý
}

/**
 * Cấu trúc tệp đính kèm chứng minh (Mục 8 TT 12/2026/TT-BTC)
 */
export interface TaiLieuDinhKemItem {
  tenFile: string;
  maLyDo: string;
  url?: string;
  kichThuoc?: number;
  ngayTao?: string;
}

/**
 * Trạng thái xử lý nội bộ của hồ sơ 09
 */
export type TrangThaiXuLy09 =
  | "cho_xu_ly"
  | "da_lap_bieu"
  | "da_ky_so"
  | "da_gui_cong"
  | "chap_nhan"
  | "tu_choi";

/**
 * Entity hoàn chỉnh của 1 Hồ sơ điều chỉnh Mẫu 09/BH
 */
export interface HoSoDieuChinh09Item {
  id: string; // Unique ID nội bộ
  stt: number;
  ttMau: TtMauInfo;
  ttXml1: TtXml1Info;
  dsXml1DieuChinh: TtXml1DieuChinhItem[];
  dsChiPhiDieuChinh: ChiPhiDieuChinhItem[];

  // Thông tin bổ trợ quản lý nội bộ & chuẩn TT 12/2026/TT-BTC
  khoaDieuTri?: string;
  nhomLoi?: string;
  tienXuatToan?: number;
  tienDeNghiThanhToanLai?: number;
  tienChapNhanLai?: number;
  taiLieuDinhKem?: (string | TaiLieuDinhKemItem)[];
  nguoiGiaiTrinh?: string;
  ngayGiaiTrinh?: string;
  maGiaoDichBhxh?: string;
  trangThai: TrangThaiXuLy09;
  signedXml?: string;
  signedAt?: string;

  /**
   * TT_KYSO theo QĐ 326 & TT 12/2026: 0 = chưa ký, 2 = đã ký số SmartCA/USB Token
   * Khi ttKySo = 2 → lock edit/delete cho record này
   */
  ttKySo: 0 | 2;
  /**
   * TINHTRANGGUI: 0 = chưa gửi cổng, 2 = đã gửi thành công
   * Khi tinhTrangGui = 2 → lock toàn bộ, không cho Hủy ký số
   */
  tinhTrangGui: 0 | 2;

  /**
   * GD_DUYET: Kết quả xử lý từ Giám định viên (Mục 10 TT 12/2026/TT-BTC)
   * 0 = Chưa xử lý, 1 = Đang xử lý, 2 = Đã xử lý
   */
  gdDuyet?: 0 | 1 | 2;

  /**
   * Loại thao tác: 'dang_thao_tac' (phiên đang mở) | 'tong_hop_moi' (phiên đã hủy)
   */
  loaiThaoTac?: "dang_thao_tac" | "tong_hop_moi";

  /**
   * Ngày thông báo lỗi từ cổng tiếp nhận (Mục 2.2)
   */
  ngayThongBaoLoi?: string;

  /**
   * Thời gian còn lại trong hạn điều chỉnh (Mục 2.2: 3 ngày làm việc trừ T7, CN)
   */
  thoiGianConLai?: string;

  /**
   * Người gửi và ngày gửi giám định (Mục 6 TT 12/2026/TT-BTC)
   */
  nguoiGui?: string;
  ngayGui?: string;

  isValid?: boolean;
  errors?: string[];
}

/**
 * Kết quả phân tích tệp Excel Mẫu 09/BH
 */
export interface ParseHs09ExcelResult {
  items: HoSoDieuChinh09Item[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  detectedHeaders: { [colIdx: number]: string };
  missingRequiredFields: string[];
  availableSheets: string[];
  selectedSheet: string;
  fileName: string;
  workbook?: unknown;
}
export interface SendHs09BatchItemResult {
  id: string;
  maLk: string;
  hoTen?: string;
  maKetQua: string;
  maGiaoDich?: string;
  thongDiep?: string;
  thoiGianTiepNhan?: string;
  kyQT?: string;
}

export interface SendHs09GatewayResult {
  maKetQua: string;
  maGiaoDich: string;
  thongDiep: string;
  thoiGianTiepNhan: string;
  totalRecords: number;
  loaiHs: string;
  kyQT?: string;
  batchResults?: SendHs09BatchItemResult[];
  successCount?: number;
  failureCount?: number;
}

export interface Hs09GatewayCredentials {
  maCskcb: string;
  username: string;
  passwordHash: string;
  accessToken: string;
  tokenId: string;
  kyQT?: string;
  maTinh?: string;
  signal?: AbortSignal;
  smartCaOptions?: {
    identityValue?: string;
    password?: string;
    totpSecret?: string;
  };
}
