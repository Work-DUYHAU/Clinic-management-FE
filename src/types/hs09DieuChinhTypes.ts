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
  trangThai: number; // TRANGTHAI (1: đề nghị điều chỉnh, 2: đề nghị hủy)
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
  trangThai: number; // TRANGTHAI tại CHIPHI: 2=Sửa thông tin chi phí, 1=Thu hồi riêng dòng này
  truongTtGoc?: string; // TRUONG_TT_GOC: Trường sai của chi phí (vd: DON_GIA, SO_LUONG, MA_DICH_VU...)
  ttGoc?: string; // TT_GOC: Giá trị ban đầu
  lyDo?: string; // LYDO: Lý do từ chối của BHXH
  tuChoi?: string; // TUCHOI: Mã lỗi / Nội dung từ chối
  truongTtDieuChinh?: string; // TRUONG_TT_DIEUCHINH: Trường điều chỉnh
  ttDieuChinh?: string; // TT_DIEUCHINH: Giá trị mới
  lyDoDieuChinh: string; // LYDO_DIEUCHINH: Lý do cơ sở KCB điều chỉnh giải trình
}

/**
 * Trạng thái xử lý nội bộ của hồ sơ 09
 */
export type TrangThaiXuLy09 = 'cho_xu_ly' | 'da_lap_bieu' | 'da_ky_so' | 'da_gui_cong' | 'chap_nhan' | 'tu_choi';

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
  
  // Thông tin bổ trợ quản lý nội bộ
  khoaDieuTri?: string;
  nhomLoi?: string;
  tienXuatToan?: number;
  tienDeNghiThanhToanLai?: number;
  tienChapNhanLai?: number;
  taiLieuDinhKem?: string[];
  nguoiGiaiTrinh?: string;
  ngayGiaiTrinh?: string;
  maGiaoDichBhxh?: string;
  trangThai: TrangThaiXuLy09;
  
  /**
   * TT_KYSO theo QĐ 326: 0 = chưa ký, 2 = đã ký số SmartCA
   * Khi ttKySo = 2 → lock edit/delete cho record này
   */
  ttKySo: 0 | 2;
  /**
   * TINHTRANGGUI: 0 = chưa gửi cổng, 2 = đã gửi thành công
   * Khi tinhTrangGui = 2 → lock toàn bộ, không cho Hủy ký số
   */
  tinhTrangGui: 0 | 2;

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

/**
 * Kết quả gửi Hồ sơ 09 lên Cổng tiếp nhận Giám định BHYT
 */
export interface SendHs09GatewayResult {
  maKetQua: string;
  maGiaoDich: string;
  thongDiep: string;
  thoiGianTiepNhan: string;
  totalRecords: number;
  loaiHs: string;
  kyQT?: string;
}

/**
 * Cấu hình thông tin xác thực gửi cổng EGW
 */
export interface Hs09GatewayCredentials {
  maCskcb: string;
  username: string;
  passwordHash: string;
  accessToken: string;
  tokenId: string;
}
