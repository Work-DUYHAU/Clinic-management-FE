// ============================================================
// CONSTANTS: ĐỊNH NGHĨA TOÀN BỘ CHỨNG TỪ Y TẾ & GIẤY TỜ ĐIỆN TỬ
// (Thông tư 25/2025/TT-BYT, TT 22/2025/TT-BYT & Quyết định liên thông BHXH 2025)
// ============================================================

import type { DocSignOptionType } from "../../types/tt25ChungTuTypes";

export type DocGroupId =
  | "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)"
  | "GIẤY TỜ ĐIỆN TỬ (QUY CHUẨN BHXH 2025)";

export interface DocTypeDefinition {
  id: Exclude<DocSignOptionType, "CURRENT">;
  code: string;
  badge: string;
  title: string;
  desc: string;
  group: DocGroupId;
  filePrefix: string;
  sheetKeywords: string[];
  headerKeywords: string[];
}

export interface DocSignOptionItem {
  id: DocSignOptionType;
  code: string;
  badge: string;
  title: string;
  desc: string;
}

export interface DocSignOptionGroup {
  group: string;
  items: DocSignOptionItem[];
}

export interface DocDetectionRule {
  type: DocSignOptionType;
  sheetKeywords: string[];
  headerKeywords: string[];
}

/**
 * SINGLE SOURCE OF TRUTH: Bảng danh mục toàn diện tất cả các mẫu hồ sơ chứng từ
 */
export const TT25_DOC_DEFINITIONS: DocTypeDefinition[] = [
  // --- NHÓM 1: HỒ SƠ CHỨNG TỪ (TT 25/2025/TT-BYT) ---
  {
    id: "CT07",
    code: "CT07",
    badge: "Mẫu 07",
    title: "CT07 - Giấy Nghỉ Việc Hưởng BHXH",
    desc: "Mẫu 07 - Đóng gói XML <HSCHUNGTU> Phụ lục 02 BHXH 2025",
    group: "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)",
    filePrefix: "CT07_NghiViecBhxh_TT25",
    sheetKeywords: ["ct07", "nghiviec"],
    headerKeywords: ["chandoandieutri", "tungay", "denngay", "ngaykcb"],
  },
  {
    id: "CT03",
    code: "CT03",
    badge: "Mẫu 02",
    title: "CT03 - Giấy Ra Viện",
    desc: "Mẫu 02 - Chứng từ xuất viện và thanh toán KCB BHYT",
    group: "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)",
    filePrefix: "CT03_GiayRaVien_TT25",
    sheetKeywords: ["ct03", "ravien"],
    headerKeywords: [
      "soluutru",
      "ngayvao",
      "ngayra",
      "ppdieutri",
      "dinhchithainghen",
    ],
  },
  {
    id: "CT04",
    code: "CT04",
    badge: "Mẫu 03",
    title: "CT04 - Bản Tóm Tắt Hồ Sơ Bệnh Án",
    desc: "Mẫu 03 - Tóm tắt diễn biến quá trình điều trị nội trú",
    group: "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)",
    filePrefix: "CT04_TomTatHsba_TT25",
    sheetKeywords: ["ct04", "tomtat", "benhan", "hsba"],
    headerKeywords: [
      "tomtatkq",
      "qtbenhly",
      "chandoanvao",
      "chandoanra",
      "phauthuat",
      "laogiaidoannang",
      "xogangiaidoanmatbu",
    ],
  },
  {
    id: "CT06",
    code: "CT06",
    badge: "Mẫu 11",
    title: "CT06 - Giấy Xác Nhận Nghỉ Dưỡng Thai",
    desc: "Mẫu 11 - Giấy chứng nhận nghỉ việc hưởng chế độ thai sản",
    group: "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)",
    filePrefix: "CT06_NghiDuongThai_TT25",
    sheetKeywords: ["ct06", "duongthai", "nghiduongthai"],
    headerKeywords: ["tuoithai", "noicutrunnd", "matinhcutru", "maxacutru"],
  },
  {
    id: "GIAYDIEUTRINOITRU",
    code: "DTNT-06",
    badge: "Mẫu 06",
    title: "Giấy Xác Nhận Điều Trị Nội Trú",
    desc: "Mẫu 06 - Xác nhận quá trình điều trị nội trú chuẩn TT25",
    group: "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)",
    filePrefix: "CT06_DieuTriNoiTru_TT25",
    sheetKeywords: ["dieutrinoitru", "noitru"],
    headerKeywords: [
      "dieutrinoitru",
      "mota",
      "loaippdieutrivosinh",
      "isnghiduongthai",
    ],
  },
  {
    id: "GIAYDIEUTRIVOSINH",
    code: "DTVS-09",
    badge: "Mẫu 09",
    title: "Giấy Xác Nhận Điều Trị Vô Sinh",
    desc: "Mẫu 09 - Xác nhận quá trình điều trị vô sinh chuẩn TT25",
    group: "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)",
    filePrefix: "CT09_DieuTriVoSinh_TT25",
    sheetKeywords: ["dieutrivosinh", "vosinh"],
    headerKeywords: [
      "dieutrivosinh",
      "matinhcutru",
      "maxacutru",
      "loaiphuongphap",
    ],
  },
  {
    id: "GIAYSUCKHOEME",
    code: "SKME-10",
    badge: "Mẫu 10",
    title: "Giấy Xác Nhận Sức Khỏe Mẹ",
    desc: "Mẫu 10 - Giấy xác nhận mẹ không đủ sức khỏe chăm con",
    group: "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)",
    filePrefix: "CT10_SucKhoeMe_TT25",
    sheetKeywords: ["suckhoeme", "skme"],
    headerKeywords: ["suckhoeme", "skme", "ketluan", "tinhtrangbenhhientai"],
  },

  // --- NHÓM 2: GIẤY TỜ ĐIỆN TỬ (QUY CHUẨN BHXH 2025) ---
  {
    id: "GIAYBAOTU",
    code: "GIAYBAOTU",
    badge: "Mã 60",
    title: "Giấy Báo Tử Điện Tử",
    desc: "Mã 60 - Gói XML <HSDLGBT> 2 References chuẩn BHXH 2025",
    group: "GIẤY TỜ ĐIỆN TỬ (QUY CHUẨN BHXH 2025)",
    filePrefix: "HSDLGBT_GiayBaoTu_Ma60",
    sheetKeywords: ["baotu", "gbt"],
    headerKeywords: [
      "ngaychet",
      "giochet",
      "nguyennhanchet",
      "ngaytv",
      "tinhtrangtv",
      "magbt",
    ],
  },
  {
    id: "GIAYCHUNGSINH",
    code: "GIAYCHUNGSINH",
    badge: "Mã 61",
    title: "Giấy Chứng Sinh Điện Tử",
    desc: "Mã 61 - Gói XML <HSDLGCS> Thông tư 22/2025/TT-BYT",
    group: "GIẤY TỜ ĐIỆN TỬ (QUY CHUẨN BHXH 2025)",
    filePrefix: "HSDLGCS_GiayChungSinh_Ma61",
    sheetKeywords: ["chungsinh", "gcs"],
    headerKeywords: [
      "tencon",
      "cannangcon",
      "lansinh",
      "magcs",
      "socon",
      "noisinhcon",
    ],
  },
];

/**
 * 1. Tự động sinh bảng ánh xạ tiền tố tệp XML (thay thế khai báo rời rạc)
 */
export const DOC_FILE_PREFIX_MAP: Record<
  Exclude<DocSignOptionType, "CURRENT">,
  string
> = TT25_DOC_DEFINITIONS.reduce(
  (acc, cur) => {
    acc[cur.id] = cur.filePrefix;
    return acc;
  },
  {} as Record<Exclude<DocSignOptionType, "CURRENT">, string>,
);

/**
 * 2. Tự động sinh bảng quy tắc nhận diện Sheet / Header Excel (thay thế khai báo rời rạc)
 */
export const DOC_DETECTION_RULES: DocDetectionRule[] = TT25_DOC_DEFINITIONS.map(
  (def) => ({
    type: def.id,
    sheetKeywords: def.sheetKeywords,
    headerKeywords: def.headerKeywords,
  }),
);

/**
 * 3. Tự động sinh nhóm tùy chọn hiển thị trên UI SmartCA (thay thế khai báo rời rạc)
 */
export const STATIC_DOC_OPTION_GROUPS: DocSignOptionGroup[] = [
  {
    group: "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)",
    items: TT25_DOC_DEFINITIONS.filter(
      (d) => d.group === "HỒ SƠ CHỨNG TỪ (THÔNG TƯ 25/2025/TT-BYT)",
    ).map((d) => ({
      id: d.id,
      code: d.code,
      badge: d.badge,
      title: d.title,
      desc: d.desc,
    })),
  },
  {
    group: "GIẤY TỜ ĐIỆN TỬ (QUY CHUẨN BHXH 2025)",
    items: TT25_DOC_DEFINITIONS.filter(
      (d) => d.group === "GIẤY TỜ ĐIỆN TỬ (QUY CHUẨN BHXH 2025)",
    ).map((d) => ({
      id: d.id,
      code: d.code,
      badge: d.badge,
      title: d.title,
      desc: d.desc,
    })),
  },
];

/**
 * Helper sinh danh sách hoàn chỉnh bao gồm tài liệu hiện hành
 */
export function getDocOptionsList(
  fileName?: string,
  itemsCount: number = 0,
  itemLabel: string = "chứng từ",
  sourceFileName?: string,
): DocSignOptionGroup[] {
  const currentTitle =
    fileName && fileName.trim().length > 0
      ? `[Tài liệu hiện hành] ${fileName}`
      : `[Tài liệu hiện hành]`;

  const countText = `${itemsCount} ${itemLabel}`;
  const currentDesc =
    fileName && fileName.trim().length > 0
      ? sourceFileName
        ? `Dữ liệu đang thao tác từ tệp "${sourceFileName}" (${countText})`
        : `Dữ liệu đang thao tác (${countText})`
      : "Chưa có tệp dữ liệu (vui lòng nạp tệp Excel / XML)";

  const currentGroup: DocSignOptionGroup[] = [
    {
      group: "TÀI LIỆU HIỆN HÀNH",
      items: [
        {
          id: "CURRENT",
          code: "HIỆN TẠI",
          badge: "Tài liệu mở",
          title: currentTitle,
          desc: currentDesc,
        },
      ],
    },
  ];

  return [...currentGroup, ...STATIC_DOC_OPTION_GROUPS];
}

/**
 * 4. Tự động nhận diện loại chứng từ từ nội dung chuỗi XML
 */
export function detectXmlDocType(xmlText: string): DocSignOptionType | null {
  const upper = xmlText.toUpperCase();
  const match = TT25_DOC_DEFINITIONS.find(
    (def) =>
      upper.includes(`<${def.id}`) ||
      upper.includes(`<${def.code}`) ||
      (def.id === "GIAYBAOTU" && upper.includes("<HSDLGBT")) ||
      (def.id === "GIAYCHUNGSINH" && upper.includes("<HSDLGCS")),
  );
  return match ? match.id : null;
}
