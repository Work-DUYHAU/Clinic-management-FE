import type { SharedSchemaField } from '../shared/excelXmlShared';

/**
 * 22 trường thông tin chuẩn khi nhập/xuất bảng Excel Mẫu 09/BH
 */
export const HS09_SCHEMA_FIELDS: SharedSchemaField[] = [
  {
    key: 'STT',
    label: 'Số Thứ Tự',
    type: 'number',
    required: true,
    desc: 'Số thứ tự bản ghi (1, 2, 3...)',
    aliases: ['STT', 'SO_THU_TU', 'SO_TT', 'NO', 'TT']
  },
  {
    key: 'MA_LK',
    label: 'Mã Liên Kết',
    type: 'string',
    required: true,
    desc: 'Mã liên kết hồ sơ khám chữa bệnh gốc (XML1)',
    aliases: ['MA_LK', 'MALK', 'MÃ LIÊN KẾT', 'MA_HO_SO', 'MÃ HỒ SƠ', 'RECORD_ID']
  },
  {
    key: 'XML1_ID',
    label: 'ID XML1',
    type: 'string',
    required: false,
    desc: 'ID định danh hồ sơ XML1 trên cổng BHXH',
    aliases: ['XML1_ID', 'XML1ID', 'ID_XML1', 'ID_HO_SO']
  },
  {
    key: 'MA_BN',
    label: 'Mã Bệnh Nhân',
    type: 'string',
    required: true,
    desc: 'Mã người bệnh tại cơ sở khám chữa bệnh',
    aliases: ['MA_BN', 'MABN', 'MÃ BỆNH NHÂN', 'MA_BENH_NHAN', 'PATIENT_ID']
  },
  {
    key: 'HO_TEN',
    label: 'Họ Và Tên Bệnh Nhân',
    type: 'string',
    required: true,
    desc: 'Họ tên của người bệnh',
    aliases: ['HO_TEN', 'HOTEN', 'TÊN BỆNH NHÂN', 'HO_VA_TEN', 'PATIENT_NAME']
  },
  {
    key: 'MA_THE',
    label: 'Mã Thẻ BHYT',
    type: 'string',
    required: true,
    desc: 'Mã thẻ BHYT (15 ký tự)',
    aliases: ['MA_THE', 'MATHE', 'MA_THE_BHYT', 'MÃ THẺ', 'SO_THE_BHYT']
  },
  {
    key: 'NGAY_VAO',
    label: 'Ngày Vào Viện',
    type: 'string',
    required: true,
    desc: 'Thời điểm vào khám bệnh / nhập viện (12 ký tự: YYYYMMDDHHmm)',
    aliases: ['NGAY_VAO', 'NGAYVAO', 'THOI_GIAN_VAO', 'GIO_VAO']
  },
  {
    key: 'NGAY_RA',
    label: 'Ngày Ra Viện',
    type: 'string',
    required: true,
    desc: 'Thời điểm kết thúc KBCB / ra viện (12 ký tự: YYYYMMDDHHmm)',
    aliases: ['NGAY_RA', 'NGAYRA', 'THOI_GIAN_RA', 'GIO_RA']
  },
  {
    key: 'KY_QT',
    label: 'Kỳ Quyết Toán',
    type: 'string',
    required: true,
    desc: 'Kỳ quyết toán (6 ký tự: YYYYMM, ví dụ 202602)',
    aliases: ['KY_QT', 'KYQT', 'KỲ QUYẾT TOÁN', 'KY_BAO_CAO', 'THANG_QT']
  },
  {
    key: 'TRANGTHAI_HS',
    label: 'Loại Yêu Cầu (1: Thu hồi, 2: Điều chỉnh, 4: Xin ý kiến)',
    type: 'number',
    required: true,
    desc: '1: Thu hồi ĐNTT, 2: Điều chỉnh dữ liệu gốc, 4: Xin ý kiến cấp có thẩm quyền (Phụ lục I TT 12/2026/TT-BTC)',
    aliases: ['TRANGTHAI_HS', 'TRANGTHAI', 'TRANG_THAI', 'LOAI_DE_NGHI', 'LOAI_YEU_CAU', 'YEU_CAU', 'LOAI_HOSO']
  },
  {
    key: 'SOBANG_XML',
    label: 'Bảng XML Chi Phí (2: Thuốc, 3: DVKT, 4: CLS...)',
    type: 'number',
    required: false,
    desc: '2: XML2 (Thuốc), 3: XML3 (DVKT/VTYT), 4: XML4 (CLS), 5: XML5 (Diễn biến)',
    aliases: ['SOBANG_XML', 'SO_BANG_XML', 'BANG_XML', 'XML_TYPE']
  },
  {
    key: 'ID_CP',
    label: 'ID Chi Phí Gốc',
    type: 'string',
    required: false,
    desc: 'ID định danh chi phí trong XML gốc',
    aliases: ['ID_CP', 'IDCP', 'MA_CHI_PHI', 'ID_DICH_VU', 'ID_THUOC']
  },
  {
    key: 'STT_XML',
    label: 'STT Trong XML Gốc',
    type: 'number',
    required: false,
    desc: 'STT dòng chi phí trong file XML gốc',
    aliases: ['STT_XML', 'STTXML', 'DONG_XML_GOC']
  },
  {
    key: 'NGAY_YL',
    label: 'Ngày Y Lệnh',
    type: 'string',
    required: false,
    desc: 'Thời điểm chỉ định y lệnh (12 ký tự YYYYMMDDHHmm)',
    aliases: ['NGAY_YL', 'NGAYYL', 'NGAY_Y_LENH', 'THOI_GIAN_YL']
  },
  {
    key: 'TRUONG_TT_GOC',
    label: 'Trường Sai Ban Đầu',
    type: 'string',
    required: true,
    desc: 'Tên trường sai sót cần điều chỉnh (vd: MA_BENH_CHINH, DON_GIA, SO_LUONG...)',
    aliases: ['TRUONG_TT_GOC', 'TRUONG_GOC', 'COT_SAI', 'TRUONG_SAI']
  },
  {
    key: 'TT_GOC',
    label: 'Giá Trị Ban Đầu',
    type: 'string',
    required: true,
    desc: 'Giá trị gốc ban đầu trước khi điều chỉnh',
    aliases: ['TT_GOC', 'GIA_TRI_GOC', 'GIA_TRI_CU', 'NOI_DUNG_GOC']
  },
  {
    key: 'TRUONG_TT_DIEUCHINH',
    label: 'Trường Sau Điều Chỉnh',
    type: 'string',
    required: true,
    desc: 'Tên trường sau điều chỉnh (thường trùng TRUONG_TT_GOC)',
    aliases: ['TRUONG_TT_DIEUCHINH', 'TRUONG_MOI', 'COT_MOI']
  },
  {
    key: 'TT_DIEUCHINH',
    label: 'Giá Trị Sau Điều Chỉnh',
    type: 'string',
    required: true,
    desc: 'Giá trị mới đề nghị thanh toán lại',
    aliases: ['TT_DIEUCHINH', 'GIA_TRI_MOI', 'GIA_TRI_DIEU_CHINH', 'NOI_DUNG_MOI']
  },
  {
    key: 'LYDO_DIEUCHINH',
    label: 'Lý Do Điều Chỉnh / Giải Trình',
    type: 'string',
    required: true,
    desc: 'Nội dung căn cứ, lý do giải trình điều chỉnh của cơ sở KCB',
    aliases: ['LYDO_DIEUCHINH', 'LY_DO_DIEU_CHINH', 'NOI_DUNG_GIAI_TRINH', 'GIAI_TRINH', 'REASON']
  },
  {
    key: 'TUCHOI',
    label: 'Mã Lỗi Từ Chối BHXH',
    type: 'string',
    required: false,
    desc: 'Mã quy tắc hoặc mã lỗi từ chối giám định BHYT (nếu có)',
    aliases: ['TUCHOI', 'MA_LOI_BHXH', 'MA_TU_CHOI', 'LOI_GIAM_DINH']
  },
  {
    key: 'LYDO',
    label: 'Lý Do BHXH Từ Chối',
    type: 'string',
    required: false,
    desc: 'Nội dung BHXH từ chối / xuất toán',
    aliases: ['LYDO', 'LY_DO_TU_CHOI', 'NOI_DUNG_XUAT_TOAN', 'NOI_DUNG_LOI']
  },
  {
    key: 'TIEN_XUAT_TOAN',
    label: 'Số Tiền Xuất Toán (VNĐ)',
    type: 'number',
    required: false,
    desc: 'Số tiền bị xuất toán / từ chối thanh toán',
    aliases: ['TIEN_XUAT_TOAN', 'SO_TIEN_XUAT_TOAN', 'TIEN_LOI', 'AMOUNT']
  },
  {
    key: 'KHOA_DIEU_TRI',
    label: 'Khoa Điều Trị (Mã Khoa hoặc Tên Khoa)',
    type: 'string',
    required: false,
    desc: 'Mã khoa hoặc tên khoa phòng điều trị (Tự động liên kết 01/DM)',
    aliases: ['KHOA_DIEU_TRI', 'KHOA', 'MA_KHOA', 'MAKHOA', 'MÃ KHOA', 'KHOA_PHONG', 'TEN_KHOA', 'KHOA ĐIỀU TRỊ', 'KHOA/PHÒNG', 'DEPARTMENT']
  },
  {
    key: 'NGUOI_GIAI_TRINH',
    label: 'Người Giải Trình (Mã CCHN, CCCD hoặc Tên BS)',
    type: 'string',
    required: false,
    desc: 'Mã CCHN, CCCD hoặc họ tên bác sĩ (Tự động liên kết 02/DM)',
    aliases: ['NGUOI_GIAI_TRINH', 'NGƯỜI GIẢI TRÌNH', 'MACCHN', 'MA_CCHN', 'SO_DINH_DANH', 'MA_BS', 'MABS', 'MÃ BÁC SĨ', 'NGUOI_LAP', 'NGUOILAPBIEU', 'NGUOI_LAP_BIEU', 'BAC_SI', 'BÁC SĨ', 'DOCTOR']
  },
  {
    key: 'NGAY_GIAI_TRINH',
    label: 'Ngày Giải Trình',
    type: 'string',
    required: false,
    desc: 'Ngày lập giải trình (YYYY-MM-DD hoặc YYYYMMDD)',
    aliases: ['NGAY_GIAI_TRINH', 'NGÀY GIẢI TRÌNH', 'NGAY_LAP', 'NGAYTHANGNAM', 'NGÀY LẬP']
  },
  {
    key: 'NHOM_LOI',
    label: 'Nhóm Lỗi Xuất Toán',
    type: 'string',
    required: false,
    desc: 'Phân loại nhóm lỗi (gia, chi_dinh, trung_lap, hanh_chinh, chung_tu, khac)',
    aliases: ['NHOM_LOI', 'NHÓM LỖI', 'LOAI_LOI', 'LOẠI LỖI', 'PHAN_LOAI_LOI']
  },
  {
    key: 'NGUOILAPBIEU',
    label: 'Người Lập Biểu',
    type: 'string',
    required: false,
    desc: 'Họ tên người lập biểu Mẫu 09/BH',
    aliases: ['NGUOILAPBIEU', 'NGUOI_LAP_BIEU', 'NGƯỜI LẬP BIỂU']
  },
  {
    key: 'THUTRUONG_DV',
    label: 'Thủ Trưởng Đơn Vị',
    type: 'string',
    required: false,
    desc: 'Họ tên thủ trưởng cơ sở khám chữa bệnh',
    aliases: ['THUTRUONG_DV', 'THỦ TRƯỞNG ĐƠN VỊ', 'GIAM_DOC', 'THU_TRUONG']
  },
  {
    key: 'NGAYTHANGNAM',
    label: 'Ngày Lập Mẫu 09/BH',
    type: 'string',
    required: false,
    desc: 'Ngày tháng năm lập biểu (YYYYMMDD)',
    aliases: ['NGAYTHANGNAM', 'NGÀY THÁNG NĂM', 'NGAY_BAO_CAO']
  }
];

export const HS09_FIELD_HEURISTICS: Array<[RegExp | string, string]> = [
  [/^STT$|^TT$|^NO$/i, 'STT'],
  [/MA.*LK|MALK|MA.*HO.*SO/i, 'MA_LK'],
  [/XML1.*ID|ID.*XML1/i, 'XML1_ID'],
  [/MA.*BN|MABN|MA.*BENH.*NHAN/i, 'MA_BN'],
  [/HO.*TEN|TEN.*BN|PATIENT/i, 'HO_TEN'],
  [/MA.*THE|MATHE|SO.*THE/i, 'MA_THE'],
  [/NGAY.*VAO|THOI.*GIAN.*VAO/i, 'NGAY_VAO'],
  [/NGAY.*RA|THOI.*GIAN.*RA/i, 'NGAY_RA'],
  [/KY.*QT|KY.*QUYET.*TOAN|THANG.*QT/i, 'KY_QT'],
  [/TRANG.*THAI.*HS|TRANG.*THAI/i, 'TRANGTHAI_HS'],
  [/BANG.*XML|SO.*BANG.*XML|SOBANG/i, 'SOBANG_XML'],
  [/ID.*CP|ID.*CHI.*PHI|ID.*DV/i, 'ID_CP'],
  [/STT.*XML|DONG.*XML/i, 'STT_XML'],
  [/NGAY.*YL|Y.*LENH/i, 'NGAY_YL'],
  [/TRUONG.*GOC|TRUONG.*SAI|TRUONG.*TT.*GOC/i, 'TRUONG_TT_GOC'],
  [/TT.*GOC|GIA.*TRI.*GOC|GIA.*TRI.*CU/i, 'TT_GOC'],
  [/TRUONG.*DIEU.*CHINH|TRUONG.*MOI|TRUONG.*TT.*DIEU.*CHINH/i, 'TRUONG_TT_DIEUCHINH'],
  [/TT.*DIEU.*CHINH|GIA.*TRI.*MOI|GIA.*TRI.*DIEU.*CHINH/i, 'TT_DIEUCHINH'],
  [/LY.*DO.*DIEU.*CHINH|NOI.*DUNG.*GIAI.*TRINH|GIAI.*TRINH/i, 'LYDO_DIEUCHINH'],
  [/TU.*CHOI|MA.*LOI|MA.*TU.*CHOI/i, 'TUCHOI'],
  [/LY.*DO.*TU.*CHOI|NOI.*DUNG.*LOI|LYDO$/i, 'LYDO'],
  [/TIEN.*XUAT.*TOAN|TIEN.*LOI|SO.*TIEN/i, 'TIEN_XUAT_TOAN'],
  [/KHOA.*DIEU.*TRI|TEN.*KHOA|^KHOA$|MA.*KHOA|KHOA.*PHONG/i, 'KHOA_DIEU_TRI'],
  [/NGUOI.*GIAI.*TRINH|BAC.*SI|MA.*CCHN|MACCHN|SO.*DINH.*DANH|MA.*BS/i, 'NGUOI_GIAI_TRINH'],
  [/NGAY.*GIAI.*TRINH/i, 'NGAY_GIAI_TRINH'],
  [/NHOM.*LOI|LOAI.*LOI|PHAN.*LOAI.*LOI/i, 'NHOM_LOI'],
  [/NGUOI.*LAP.*BIEU|NGUOILAPBIEU/i, 'NGUOILAPBIEU'],
  [/THU.*TRUONG|GIAM.*DOC/i, 'THUTRUONG_DV'],
  [/NGAY.*THANG.*NAM|NGAYTHANGNAM/i, 'NGAYTHANGNAM']
];

export const SO_BANG_XML_MAP: Record<number, string> = {
  1: 'XML1 - Thông tin tổng hợp KCB',
  2: 'XML2 - Danh mục thuốc, chế phẩm máu',
  3: 'XML3 - Dịch vụ kỹ thuật, VTYT',
  4: 'XML4 - Kết quả cận lâm sàng',
  5: 'XML5 - Diễn biến lâm sàng'
};

export const NHOM_LOI_XUAT_TOAN_MAP: Record<string, string> = {
  gia: 'Sai giá / Chưa áp đúng giá trúng thầu',
  chi_dinh: 'Chỉ định chưa phù hợp hướng dẫn chẩn đoán',
  trung_lap: 'Trùng lặp dịch vụ / trùng ngày y lệnh',
  hanh_chinh: 'Sai thông tin hành chính / Thẻ BHYT',
  chung_tu: 'Thiếu hồ sơ bệnh án / biên bản hội chẩn',
  khac: 'Lý do khác'
};

export const HS09_EXCEL_TEMPLATE_HEADERS = HS09_SCHEMA_FIELDS.map(f => f.key);

export const HS09_EXCEL_TEMPLATE_COLS = [
  { wch: 6 },  // STT
  { wch: 16 }, // MA_LK
  { wch: 14 }, // XML1_ID
  { wch: 14 }, // MA_BN
  { wch: 22 }, // HO_TEN
  { wch: 18 }, // MA_THE
  { wch: 16 }, // NGAY_VAO
  { wch: 16 }, // NGAY_RA
  { wch: 10 }, // KY_QT
  { wch: 12 }, // TRANGTHAI_HS
  { wch: 12 }, // SOBANG_XML
  { wch: 14 }, // ID_CP
  { wch: 10 }, // STT_XML
  { wch: 16 }, // NGAY_YL
  { wch: 18 }, // TRUONG_TT_GOC
  { wch: 20 }, // TT_GOC
  { wch: 20 }, // TRUONG_TT_DIEUCHINH
  { wch: 20 }, // TT_DIEUCHINH
  { wch: 35 }, // LYDO_DIEUCHINH
  { wch: 14 }, // TUCHOI
  { wch: 30 }, // LYDO
  { wch: 16 }  // TIEN_XUAT_TOAN
];

export const HS09_EXCEL_TEMPLATE_SAMPLES: (string | number)[][] = [];
