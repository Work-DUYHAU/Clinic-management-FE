import { httpPost } from "./httpClient";
import type {
  Hs01TongHopItem,
  SendHs01GatewayResult,
} from "../../types/hs01TongHopTypes";
import type { SmartCaSignatureResult } from "../../types/smartcaTypes";
import {
  DEFAULT_MA_CSKCB,
  DEFAULT_MA_TINH,
  xmlToBase64,
  getThoiGianTiepNhan,
} from "../../utils/shared/excelXmlShared";
import { generateHs01Xml } from "../../utils/hs01TongHopXmlEngine";

export interface SendBhxhHoSo01Params {
  fileBase64Str?: string;
  xmlContent?: string;
  loaiHs?: string;
  kyQT?: string;
  maCskcb?: string;
  maTinh?: string;
  tranId?: string;
  signal?: AbortSignal;
}

export interface SendBhxhHoSo01Result {
  success: boolean;
  statusCode: number;
  maKetQua: string;
  thongDiep: string;
  ghiChu?: string;
  maGiaoDich?: string;
  data?: unknown;
}

export async function sendBhxhHoSo01WithBackend(
  params: SendBhxhHoSo01Params,
): Promise<SendBhxhHoSo01Result> {
  const {
    fileBase64Str,
    xmlContent,
    loaiHs = "5",
    kyQT,
    maCskcb,
    maTinh,
    tranId,
    signal,
  } = params;

  let base64 = fileBase64Str || "";
  if (!base64 && xmlContent) {
    base64 = btoa(unescape(encodeURIComponent(xmlContent)));
  }

  if (!base64) {
    throw new Error("Không có dữ liệu tệp XML / Base64 để gửi lên Cổng BHXH.");
  }

  return await httpPost<SendBhxhHoSo01Result>(
    "/bhxh/gui-ho-so-tong-hop-01",
    {
      fileBase64Str: base64,
      loaiHs,
      kyQT,
      maCskcb,
      maTinh,
      tranId,
    },
    { signal },
  );
}

export async function sendHs01ToBhxhGateway(
  items: Hs01TongHopItem[],
  credentials?: Partial<{
    maCskcb: string;
    username: string;
    passwordHash: string;
    accessToken: string;
    tokenId: string;
    maTinh: string;
    kyQT: string;
  }>,
  signature?: SmartCaSignatureResult,
  customFileBase64?: string,
): Promise<SendHs01GatewayResult> {
  const maCskcb = credentials?.maCskcb || DEFAULT_MA_CSKCB;

  // 1. Trích xuất kỳ quyết toán từ dữ liệu hồ sơ thực tế (NAM_QT & THANG_QT từ file Excel)
  const firstItem = items[0];
  let namQt = firstItem?.namQt;
  let thangQt = firstItem?.thangQt
    ? String(firstItem.thangQt).padStart(2, "0")
    : undefined;

  // 2. Nếu tệp nạp từ XML máy tính, quét trực tiếp thẻ <NAM_QT> và <THANG_QT> trong XML
  if (!namQt || !thangQt) {
    const signedXmlFromSig = signature?.signedXml;
    let xmlContent = signedXmlFromSig || "";
    if (!xmlContent && customFileBase64) {
      try {
        xmlContent = atob(customFileBase64);
      } catch {
        // bỏ qua
      }
    }
    if (xmlContent) {
      const matchNam = xmlContent.match(/<NAM_QT>(\d{4})<\/NAM_QT>/);
      const matchThang = xmlContent.match(/<THANG_QT>(\d{1,2})<\/THANG_QT>/);
      if (matchNam) namQt = Number(matchNam[1]);
      if (matchThang) thangQt = String(matchThang[1]).padStart(2, "0");
    }
  }

  const finalNamQt = namQt || new Date().getFullYear();
  const finalThangQt =
    thangQt || String(new Date().getMonth() + 1).padStart(2, "0");
  const dataKyQt = `${finalNamQt}${finalThangQt}`;
  const kyQT = credentials?.kyQT || dataKyQt;

  // Ưu tiên tệp XML Base64 đã ký số thực tế để bảo toàn 100% chữ ký điện tử
  const signedXmlFromSig = signature?.signedXml;
  const base64 = signedXmlFromSig
    ? xmlToBase64(signedXmlFromSig)
    : customFileBase64 || xmlToBase64(generateHs01Xml(items, maCskcb));

  // 1. ƯU TIÊN: Gửi qua Backend API (Server-side Cổng BHXH, bảo mật token & xử lý retry tập trung)
  try {
    const beRes = await sendBhxhHoSo01WithBackend({
      fileBase64Str: base64,
      loaiHs: "5",
      kyQT,
      maCskcb,
      maTinh: credentials?.maTinh || DEFAULT_MA_TINH,
      tranId: signature?.tranId,
    });

    const isOk =
      String(beRes.maKetQua) === "200" ||
      String(beRes.maKetQua) === "0" ||
      beRes.success;

    return {
      maKetQua: String(beRes.maKetQua || (isOk ? "200" : "500")),
      maGiaoDich:
        beRes.maGiaoDich ||
        (isOk
          ? `HS01BH_${maCskcb}_${kyQT}_${Date.now().toString().slice(-6)}`
          : ""),
      thongDiep:
        beRes.thongDiep ||
        beRes.ghiChu ||
        (isOk
          ? `Tiếp nhận thành công ${items.length} hồ sơ tổng hợp Mẫu 01/BH (Kỳ QT: ${finalThangQt}/${finalNamQt}) lên Cổng BHXH qua Backend` +
            (signature ? ` (đã ký số SmartCA)` : "")
          : `Cổng BHXH phản hồi mã: ${beRes.maKetQua}`),
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: items.length,
      kyQT,
      loaiHs: "5",
    };
  } catch (backendErr: unknown) {
    const errorMsg =
      backendErr instanceof Error
        ? backendErr.message
        : "Không thể kết nối đến máy chủ Backend hoặc Cổng BHXH";
    console.error("[HS01] Lỗi gửi hồ sơ qua Backend:", backendErr);
    return {
      maKetQua: "500",
      maGiaoDich: "",
      thongDiep: `Lỗi kết nối Backend: ${errorMsg}`,
      thoiGianTiepNhan: getThoiGianTiepNhan(),
      totalRecords: items.length,
      kyQT,
      loaiHs: "5",
    };
  }
}

