export type Tt25ChungTuCode =
  | "CT03" // Giấy ra viện (Mẫu 02 - TT25)
  | "CT04" // Bản tóm tắt hồ sơ bệnh án (Mẫu 03 - TT25)
  | "CT06" // Giấy xác nhận nghỉ dưỡng thai (Mẫu 11 - TT25)
  | "CT07" // Giấy chứng nhận nghỉ việc hưởng BHXH (Mẫu 07 - TT25)
  | "GIAYDIEUTRINOITRU" // Giấy xác nhận quá trình điều trị nội trú (Mẫu 06 - TT25)
  | "GIAYDIEUTRIVOSINH" // Giấy xác nhận quá trình điều trị vô sinh (Mẫu 09 - TT25)
  | "GIAYSUCKHOEME" // Giấy xác nhận mẹ không đủ sức khỏe chăm con (Mẫu 10 - TT25)
  | "GIAYBAOTU" // Giấy báo tử điện tử
  | "GIAYCHUNGSINH"; // Giấy chứng sinh điện tử (TT 22/2025)

/** Tùy chọn loại chứng từ trong UI SmartCA */
export type DocSignOptionType = "CURRENT" | Tt25ChungTuCode;

/** Mã loại hồ sơ phân luồng gửi cổng BHXH Việt Nam */
export type BhxhLoaiHoSoCode =
  | "39" // Các chứng từ theo TT 25/2025/TT-BYT
  | "60" // Giấy báo tử
  | "61"; // Giấy chứng sinh (TT 22/2025)

/** Bảng ánh xạ tự động từ Loại chứng từ sang Mã loại hồ sơ gửi cổng BHXH */
export const MAP_CHUNG_TU_TO_BHXH_LOAI_HO_SO: Record<
  Tt25ChungTuCode,
  BhxhLoaiHoSoCode
> = {
  CT03: "39",
  CT04: "39",
  CT06: "39",
  CT07: "39",
  GIAYDIEUTRINOITRU: "39",
  GIAYDIEUTRIVOSINH: "39",
  GIAYSUCKHOEME: "39",
  GIAYBAOTU: "60",
  GIAYCHUNGSINH: "61",
};

// ------------------------------------------------------------
// 1. CÁC KIỂU DỮ LIỆU CHỨNG TỪ CON (XML PAYLOAD)
// ------------------------------------------------------------

/** CT03: Giấy ra viện (Mẫu 02 - TT25) */
export interface Ct03GiayRaVien {
  soLuuTru?: string;
  maYTe: string;
  maKhoa: string;
  maBhxh: string;
  maThe: string;
  hoTen: string;
  ngaySinh: string; // YYYYMMDD
  gioiTinh?: "1" | "2" | "3" | string; // 1: Nam, 2: Nữ, 3: Chưa xác định, hoặc rỗng nếu Excel không có
  maDanToc: string;
  ngheNghiep?: string;
  diaChi: string;
  ngayVao: string; // YYYYMMDDHHmm
  ngayRa: string; // YYYYMMDDHHmm
  dinhChiThaiNghen?: "0" | "1" | string; // 1: Có, 0: Không
  tuoiThai?: string;
  chanDoan: string;
  ppDieuTri: string;
  ghiChu?: string;
  thuTruongDvi: string;
  maCchnTruongKhoa: string;
  tenTruongKhoa: string;
  ngayChungTu: string; // YYYYMMDD
  tekt?: "0" | "1" | string; // 1: Có, 0: Không (Trẻ em không thẻ)
  hoTenCha?: string;
  hoTenMe?: string;
  ngoaitruTuNgay?: string;
  ngoaitruDenNgay?: string;
  loaiGiayTo?: "1" | "2" | "3" | "4" | "0" | string; // 1: CCCD, 2: CMND, 3: Hộ chiếu, 4: Định danh công dân, 0: Không giấy tờ
  soCccd: string;
  ngayCapCccd?: string;
  noiCapCccd?: string;
  benhIcd10Id: string;
  tenBenhIcd10: string;
}

/** Giấy xác nhận điều trị nội trú (Mẫu 06 - TT25 / XML <CTGiayDieuTriNoiTru>) */
export interface GiayDieuTriNoiTru06 {
  soLuuTru?: string;
  maYTe: string;
  maBhxh: string;
  maThe: string;
  hoTen: string;
  ngaySinh: string; // YYYYMMDD
  gioiTinh?: "1" | "2" | "3" | string; // 1: Nam, 2: Nữ, 3: Chưa xác định
  maKhoa: string;
  tenDanToc?: string;
  maDanToc: string;
  ngheNghiep?: string;
  diaChi: string;
  ngayVao: string; // YYYYMMDDHHmm
  ngayRa: string; // YYYYMMDDHHmm
  chanDoan: string;
  ppDieuTri: string;
  moTa?: string;
  ghiChu?: string;
  daiDienDvi: string;
  maCchnBs: string;
  tenBs: string;
  loaiGiayTo?: "1" | "2" | "3" | "4" | "0" | string;
  soCccd: string;
  ngayCapCccd?: string;
  noiCapCccd?: string;
  benhIcd10Ma: string;
  benhIcd10Ten: string;
  maCt?: string;
  ngayCt?: string;
  soSeri?: string;
  tuoiThai?: string;
  loaiPhuongPhap?: string;
  loaiPpDieuTriVoSinh?: string;
  ngayDinhChiThainghen?: string;
  isNghiduongthai?: "0" | "1" | string;
  soNgayNghiduongthai?: string;
}

/** Giấy xác nhận điều trị vô sinh (Mẫu 09 - TT25 / XML <CTGiayDieuTriVoSinh>) */
export interface GiayDieuTriVoSinh09 {
  soLuuTru?: string;
  maYTe: string;
  maBhxh: string;
  maThe: string;
  hoTen: string;
  ngaySinh: string; // YYYYMMDD (Không có GIOI_TINH, không MA_DANTOC)
  maKhoa: string;
  maTinhCuTru?: string;
  maXaCuTru?: string;
  ngheNghiep?: string;
  diaChi: string;
  ngayVao: string; // YYYYMMDDHHmm
  ngayRa: string; // YYYYMMDDHHmm
  chanDoan: string;
  ppDieuTri: string;
  ghiChu?: string;
  daiDienDvi: string;
  maCchnBs: string;
  tenBs: string;
  loaiGiayTo?: "1" | "2" | "3" | "4" | "0" | string;
  soCccd: string;
  ngayCapCccd?: string;
  noiCapCccd?: string;
  benhIcd10Ma: string;
  benhIcd10Ten: string;
  maCt?: string;
  ngayCt?: string;
  soSeri?: string;
  loaiPhuongPhap?: string;
}

/** Giấy xác nhận sức khỏe mẹ (Mẫu 10 - TT25 / XML <CTGiaySucKhoeMe>) */
export interface GiaySucKhoeMe10 {
  soLuuTru?: string;
  maYTe: string;
  maBhxh: string;
  maThe: string;
  hoTen: string;
  ngaySinh: string; // YYYYMMDD (Không có GIOI_TINH, không MA_DANTOC)
  maKhoa: string;
  maTinhCuTru?: string;
  maXaCuTru?: string;
  ngheNghiep?: string;
  diaChi: string;
  ngayVao: string; // YYYYMMDDHHmm
  ngayRa: string; // YYYYMMDDHHmm
  chanDoan: string;
  ppDieuTri: string;
  ketLuan?: string;
  tinhTrangBenhHienTai?: string;
  daiDienDvi: string;
  maCchnBs: string;
  tenBs: string;
  loaiGiayTo?: "1" | "2" | "3" | "4" | "0" | string;
  soCccd: string;
  ngayCapCccd?: string;
  noiCapCccd?: string;
  benhIcd10Ma: string;
  benhIcd10Ten: string;
  maCt?: string;
  ngayCt?: string;
  soSeri?: string;
}

/** CT04: Bản tóm tắt hồ sơ bệnh án (Mẫu 03 - TT25) */
export interface Ct04TomTatHsba {
  maCt?: string;
  soSeri?: string;
  maBhxh: string;
  maThe: string;
  hoTen: string;
  ngaySinh: string; // YYYYMMDD
  gioiTinh?: "1" | "2" | "3" | string;
  maDanToc: string;
  diaChi: string;
  ngheNghiep?: string;
  hoTenCha?: string;
  hoTenMe?: string;
  nguoiGiamHo?: string;
  tenDonVi?: string;
  nguoiDaiDien?: string;
  ngayCt: string; // YYYYMMDD
  ngayVao: string; // YYYYMMDDHHmm
  ngayRa: string; // YYYYMMDDHHmm
  chanDoanVao: string;
  chanDoanRa: string;
  qtBenhLy: string;
  tomTatKq: string;
  ppDieuTri: string;
  ngaySinhCon?: string;
  ngayChetCon?: string;
  soConChet?: string;
  ttRaVien?: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | string; // 1: khỏi, 2: đỡ, 3: không đổi, 4: nặng hơn, 5: tử vong...
  ghiChu?: string;
  tekt?: "0" | "1" | string;
  loaiGiayTo?: "1" | "2" | "3" | "4" | "0" | string;
  soCccd: string;
  ngayCapCccd?: string;
  noiCapCccd?: string;
  lyDoVVien?: "1" | "2" | "3" | "4" | string; // 1: KCB BĐ, 2: Chuyển đến, 3: Cấp cứu, 4: Trái tuyến
  tienSuBenh?: string;
  dauHieuLamSang?: string;
  noiKhoa?: string;
  isNoiKhoa?: "0" | "1" | string;
  phauThuatThuThuat?: string;
  isPhauThuatThuThuat?: "0" | "1" | string;
  huongDieuTri?: string;
  benhIcd10Id: string;
  benhIcd10Ten: string;
  isLaoGiaiDoanNang?: "0" | "1" | string;
  isXoGanGiaiDoanMatBu?: "0" | "1" | string;
}

/** CT06: Giấy xác nhận nghỉ dưỡng thai (Mẫu 11 - TT25) */
export interface Ct06NghiDuongThai {
  maBhxh: string;
  maThe: string;
  hoTen: string;
  ngaySinh: string;
  ngayVao: string; // YYYYMMDD
  ngayRa: string; // YYYYMMDD
  chanDoan: string;
  nguoiDaiDien?: string;
  maBs: string;
  tenBs: string;
  tenDvi: string;
  soKcb?: string;
  ngayCt: string;
  soSeri?: string;
  maCt?: string;
  loaiGiayTo?: "1" | "2" | "3" | "4" | "0" | string;
  soCccd: string;
  ngayCapCccd?: string;
  noiCapCccd?: string;
  noiCuTruNnd?: string;
  maTinhCuTru?: string;
  maXaCuTru?: string;
  tuoiThai: string;
  benhIcd10Id: string;
  benhIcd10Ten: string;
}

/** CT07: Giấy chứng nhận nghỉ việc hưởng BHXH (Mẫu 07 - TT25) */
export interface Ct07NghiViecBhxh {
  maCt?: string;
  mauSo?: string;
  soSeri?: string;
  soKcb?: string;
  maBhxh: string;
  maThe: string;
  hoTen: string;
  ngaySinh: string;
  gioiTinh?: "1" | "2" | "3" | string;
  donVi?: string;
  chanDoanDieuTri: string;
  tuNgay: string; // YYYYMMDD
  denNgay: string; // YYYYMMDD
  hoTenCha?: string;
  hoTenMe?: string;
  thuTruongDv: string;
  maCchn: string;
  tenNguoiHanhNghe: string;
  ngayChungTu: string;
  tekt?: "0" | "1" | string;
  loaiGiayTo?: "1" | "2" | "3" | "4" | "0" | string;
  soCccd: string;
  ngayCapCccd?: string;
  noiCapCccd?: string;
  ngayKcb: string;
  benhIcd10Id: string;
  benhIcd10Ten: string;
}

/** Giấy báo tử (Loại hồ sơ 60 - XML <HSDLGBT>) */
export interface GiayBaoTu60 {
  id?: string;
  maGbt: string;
  maBn: string;
  maHsba: string;
  hoTen: string;
  ngaySinh: string;
  gioiTinh?: "1" | "2" | "3" | string;
  maThe?: string;
  maDanToc: string;
  maQuocTich: string;
  dchiThuongTru: string;
  maTinhThuongTru: string;
  maHuyenThuongTru?: string;
  maXaThuongTru?: string;
  dchiHienTai?: string;
  maTinhHienTai?: string;
  maHuyenHienTai?: string;
  maXaHienTai?: string;
  loaiGiayTo?: "1" | "2" | "3" | "7" | "4" | "5" | "6" | string;
  soGiayTo: string;
  ngayCap?: string;
  noiCap?: string;
  ngayGioVv: string; // YYYYMMDDHHmm
  ngayTv: string; // YYYYMMDDHHmm
  tinhTrangTv?: "0" | "1" | string; // 1: Có tử vong trên đường cấp cứu, 0: Không
  nguyenNhanTv: string;
  nguoiGhiGiay: string;
  nguoiThanThich?: string;
  tTruongDvi: string;
  soBaoTu: string;
  quyenSo: string;
  ngayCapGiayBt: string;
  maCskcb: string;
  diaChiCskcb: string;
  maBhxh?: string;
  benhIcd10Id: string;
  benhIcd10Ten: string;
}

/** Giấy chứng sinh (Loại hồ sơ 61 - XML <HSDLGCS>) */
export interface GiayChungSinh61 {
  id?: string;
  maGcs: string;
  maBn: string;
  soSeri?: string;
  maBhxhNnd?: string;
  maTheNnd?: string;
  hotenNnd: string;
  ngaysinhNnd: string;
  maDantocNnd: string;
  maQuoctichNnd: string;
  loaiGiaytoNnd?: string;
  soCccdNnd: string;
  ngaycapCccdNnd?: string;
  noicapCccdNnd?: string;
  noiCuTruNnd?: string;
  matinhCuTru?: string;
  maxaCuTru?: string;
  hoTenCha?: string;
  tenCon: string;
  gioiTinhCon?: "1" | "2" | "3" | string;
  soCon: string;
  lanSinh: string;
  soConSong: string;
  canNangCon: string;
  ngaySinhCon: string; // 14 ký tự YYYYMMDDHHmmss
  noiSinhCon: string;
  tinhTrangCon: string;
  sinhconPhauthuat?: "0" | "1" | string;
  sinhconDuoi32tuan?: "0" | "1" | string;
  capLanDau?: "0" | "1" | string;
  ghiChu?: string;
  nguoiDoDe: string;
  nguoiGhiPhieu: string;
  maTtdv: string;
  thuTruongDvi: string;
  ngayCt: string;
  so?: string;
  quyenSo?: string;
}

// ------------------------------------------------------------
// 2. GIAO DIỆN KẾT NỐI API CỔNG BHXH 2025
// ------------------------------------------------------------

export interface BhxhTokenRequest {
  username: string;
  password: string;
}

export interface BhxhTokenResponse {
  maKetQua: string | number; // "200" hoặc 200
  apiToken?: string;
  idToken?: string;
  passwordHash?: string;
  APIKey?: {
    access_token: string;
    id_token: string;
    token_type: string;
    username: string;
    expires_in: string;
  };
  thongDiep?: string;
  message?: string;
}

export interface BhxhSendChungTuRequest {
  token: string;
  loaiHs?: string; // '39'
  fileBase64Str: string;
}

export interface BhxhSendChungTuResponse {
  maKetQua: string | number;
  maGiaoDich?: string;
  ghiChu?: string;
  message?: string;
  thoiGianTiepNhan?: string;
  ThoiGianTiepNhan?: string;
}

export interface BhxhSendGiayToDienTuRequest {
  token: string;
  loaiHs: "60" | "61" | string;
  fileBase64Str: string;
}

export interface BhxhSendGiayToDienTuResponse {
  maKetQua: string | number;
  maGiaoDich?: string;
  ghiChu?: string;
  message?: string;
  thoiGianTiepNhan?: string;
  ThoiGianTiepNhan?: string;
}

export interface BhxhGuiChungTu2025Request {
  maCskcb: string;
  token: string;
  id_token: string;
  username: string;
  password: string;
  loaiHs: "39" | "60" | "61";
  fileBase64Str: string;
}

export interface BhxhGuiChungTu2025Response {
  MaKetQua: string; // "200"
  MaGD?: string; // "HS_XXXXXXX"
  ThoiGianTiepNhan?: string; // "20251031152649"
  message?: string;
}
