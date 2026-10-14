import { httpPost } from "./httpClient";

export interface GatewaySendResult {
  maKetQua: string;
  maGiaoDich: string;
  thongDiep: string;
  thoiGianTiepNhan: string;
  totalRecords: number;
  loaiHs?: string;
  chiTietLoi?: unknown;
}

export interface SendDanhMucParams {
  loaiHs: string;
  recordCount: number;
  recordLabel: string;
  maCskcb?: string;
  maTinh?: string;
  fileBase64Str?: string;
}

export const LOAI_HS_NORMALIZED: Record<string, string> = {
  DANHMUC01: "70",
  DM01: "70",
  "70": "70",
  DANHMUC02: "71",
  DM02: "71",
  "71": "71",
  DANHMUC03: "10",
  DM03: "10",
  "10": "10",
  DANHMUC04: "11",
  DM04: "11",
  "11": "11",
  DANHMUC05: "12",
  DM05: "12",
  "12": "12",
  DANHMUC06: "72",
  DM06: "72",
  "72": "72",
};

export const LOAI_HS_TO_SLUG: Record<string, string> = {
  "70": "dm01",
  "71": "dm02",
  "10": "dm03",
  "11": "dm04",
  "12": "dm05",
  "72": "dm06",
};

export async function sendDanhMucToBhxhGateway(
  loaiHs: string,
  recordCount: number,
  recordLabel: string,
  maCskcb = "49939",
  maTinh = "48",
  fileBase64Str?: string,
): Promise<GatewaySendResult> {
  const officialLoaiHs = LOAI_HS_NORMALIZED[loaiHs] || loaiHs;
  const slug = LOAI_HS_TO_SLUG[officialLoaiHs] || "dm01";

  const getTimestamp = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  };

  try {
    interface DanhMucApiResponse {
      success?: boolean;
      maKetQua?: string | number;
      maGiaoDich?: string;
      thongDiep?: string;
      ghiChu?: string;
      thoiGianTiepNhan?: string;
      chiTietLoi?: unknown;
    }

    const data = await httpPost<DanhMucApiResponse>(
      `/danh-muc/${slug}/gui-cong`,
      {
        fileBase64Str,
        loaiHs: officialLoaiHs,
        maCskcb,
        maTinh,
      },
    );

    const isOk = Boolean(data.success || String(data.maKetQua) === "200");

    return {
      maKetQua: String(data.maKetQua ?? (isOk ? "200" : "500")),
      maGiaoDich:
        data.maGiaoDich ||
        (isOk
          ? `${loaiHs}_T${maTinh}_${maCskcb}_${Date.now().toString().slice(-6)}`
          : ""),
      thongDiep:
        data.thongDiep ||
        data.ghiChu ||
        (isOk
          ? `Tiếp nhận thành công ${recordCount} bản ghi ${recordLabel} vào Cổng BHXH`
          : `Cổng BHXH phản hồi mã kết quả: ${data.maKetQua ?? "500"}`),
      thoiGianTiepNhan: data.thoiGianTiepNhan || getTimestamp(),
      totalRecords: recordCount,
      loaiHs: officialLoaiHs,
      chiTietLoi: data.chiTietLoi,
    };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Lỗi kết nối Cổng BHXH";
    return {
      maKetQua: "500",
      maGiaoDich: "",
      thongDiep: errorMsg,
      thoiGianTiepNhan: getTimestamp(),
      totalRecords: recordCount,
      loaiHs: officialLoaiHs,
    };
  }
}
