// ==========================================
// 1. DANH MỤC 01/DM: BỘ PHẬN CHUYÊN MÔN (LOẠI 70)
// ==========================================
export interface DmBpcmItem {
  id?: string;
  stt: number;
  maKhoa: string;
  tenKhoa: string;
  banKham: number;
  giuongPd: number;
  giuongTk: number;
  giuongHstc: number;
  giuongHscc: number;
  tuNgay: string; // YYYYMMDD
  denNgay?: string; // YYYYMMDD hoặc để trống
  maCskcb: string; // 5 ký tự (vd: 49939, 79012)
  isValid?: boolean;
  errors?: string[];
}

// ==========================================
// 2. DANH MỤC 02/DM: NHÂN LỰC KCB BHYT (LOẠI 71 - GuiDanhMuc02_NLKCB)
// ==========================================
export interface DmNhanLucItem {
  id?: string;
  stt: number;
  maKhoa: string; // 100
  tenKhoa: string; // n
  hoTen: string; // 250
  gioiTinh: number; // 1: Nam, 2: Nữ, 3: Chưa xác định
  soDinhDanh: string; // CCCD / Định danh (15)
  chucDanhNn: string; // "1": Bác sỹ, "2": Y sỹ, "3": Điều dưỡng, "4": Hộ sinh, "5": Kỹ thuật y, "6": CN tâm lý LS, "7": Lương y, "8": Dược sỹ, "9": Khác
  viTri?: string; // "1": PTCM, "2": Trưởng khoa, "3": PTCM kiêm TK, "4": Đứng đầu/ký giấy tờ, "5": Phụ trách khoa, "6": NĐ 96
  macchn?: string; // Số CCHN (250)
  ngaycapCchn?: string; // YYYYMMDD
  noicapCchn?: string; // 250
  phamviCm?: string; // 15
  phamviCmbs?: string; // YYYYMMDD_Z (50)
  dvktKhac?: string; // Mã DVKT ngoài phạm vi
  vbPhancong?: string; // YYYYMMDD_Z (50)
  thoigianDk: number; // 1: Toàn thời gian, 2: Bán thời gian
  thoigianNgay?: string; // Giờ làm việc (ví dụ 0800-1200 hoặc T20800-1500;...)
  thoigianTuan?: string; // Ngày trong tuần (ví dụ T2T3T5, CN)
  cskcbKhac?: string; // 30
  cskcbCgkt?: string; // 5
  qdCgkt?: string; // YYYYMMDDZ (50)
  tuNgay: string; // YYYYMMDD
  denNgay?: string; // YYYYMMDD
  maCskcb: string; // 5
  isValid?: boolean;
  errors?: string[];
}

export * from './bpcmTypes';
export * from './nhanLucTypes';
export * from './thuocTypes';
export * from './thietBiTypes';
export * from './dichVuTypes';
export * from './tbyttHdvTypes';
export * from './hs01TongHopTypes';
export * from './hs09DieuChinhTypes';
export * from './hs09ApiTypes';
export * from './smartcaTypes';
