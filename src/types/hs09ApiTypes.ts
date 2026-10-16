import type {
  HoSoDieuChinh09Item,
  Hs09GatewayCredentials,
} from "./hs09DieuChinhTypes";
import type { SmartCaSignatureResult } from "./smartcaTypes";

export interface SendBhxhHoSo09Params {
  fileBase64Str?: string;
  xmlContent?: string;
  loaiHs?: string;
  kyQT?: string;
  maCskcb?: string;
  maTinh?: string;
  tranId?: string;
  signal?: AbortSignal;
}

export interface SendBhxhHoSo09Result {
  success: boolean;
  statusCode: number;
  maKetQua: string;
  thongDiep: string;
  ghiChu?: string;
  maGiaoDich?: string;
  data?: unknown;
}

export interface SendBhxhHoSo09HangLoatItem {
  id?: string;
  maLk?: string;
  hoTen?: string;
  fileBase64Str?: string;
  xmlContent?: string;
  kyQT?: string;
  tranId?: string;
  ghiChu?: string;
}

export interface SendBhxhHoSo09HangLoatParams {
  items: SendBhxhHoSo09HangLoatItem[];
  maCskcb?: string;
  maTinh?: string;
  kyQT?: string;
  loaiHs?: string;
  signal?: AbortSignal;
}

export interface SendBhxhHoSo09HangLoatResult {
  success: boolean;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  thongDiep: string;
  items: Array<{
    id?: string;
    maLk?: string;
    hoTen?: string;
    maKetQua: string;
    maGiaoDich: string;
    thongDiep: string;
    thoiGianTiepNhan: string;
    kyQT?: string;
    _signUpdate?: {
      signedXml: string;
      signedAt?: string;
      ttKySo?: 0 | 2;
    };
  }>;
}

export interface Hs09AuditLogEntry {
  id: string;
  timestamp: string;
  maCskcb: string;
  maTinh: string;
  loaiHs: string;
  kyQT?: string;
  maLk?: string;
  hoTen?: string;
  tranId?: string;
  maKetQua: string;
  maGiaoDich?: string;
  thongDiep: string;
  success: boolean;
  totalRecords?: number;
  successCount?: number;
  failureCount?: number;
  type: "single" | "batch";
}

export interface SendSingleItemParams {
  item: HoSoDieuChinh09Item;
  maCskcb: string;
  isSingleItem?: boolean;
  signatureBlock?: string | null;
  signatureTranId?: string;
  credentialsKyQt?: string;
  maTinh?: string;
  customFileBase64?: string;
  signal?: AbortSignal;
  smartCaOptions?: {
    identityValue?: string;
    password?: string;
    totpSecret?: string;
  };
}

/** Options to pass to sendHs09ToBhxhGateway (alias for positional args) */
export interface SendHs09Options {
  items: HoSoDieuChinh09Item[];
  credentials?: Partial<Hs09GatewayCredentials>;
  signature?: SmartCaSignatureResult;
  customFileBase64?: string;
  onProgress?: (
    current: number,
    total: number,
    currentItem: HoSoDieuChinh09Item,
  ) => void;
}

/** Progress info emitted during a batch send */
export interface BatchSendHs09Progress {
  current: number;
  total: number;
  currentItem: HoSoDieuChinh09Item;
}
