export type KyHoSoStep = 'empty' | 'uploaded' | 'signed' | 'sent';

export type SignatureElementType = 'stamp' | 'signature';

export interface SignaturePosition {
  id: string;
  pageIndex: number;
  type: SignatureElementType;
  x: number; // Tọa độ pixel trên canvas hiện thời
  y: number; // Tọa độ pixel trên canvas hiện thời
  width: number;
  height: number;
  // Tọa độ chuẩn hóa theo tỷ lệ (0.0 đến 1.0) của trang PDF để bám chặt khi zoom
  percentX?: number;
  percentY?: number;
  percentWidth?: number;
  percentHeight?: number;
}

export interface SignAnchorTarget {
  id: string;
  label: string;
  role: string;
  signerName?: string;
  side?: 'kcb' | 'default';
  pageIndex: number;
  percentX: number;
  percentY: number;
  canvasX: number;
  canvasY: number;
  matchedText: string;
  isPrimary?: boolean;
}

export interface KyHoSoDocInfo {
  file?: File;
  fileName: string;
  fileSize?: string;
  fileType: string;
  uploadedAt: string;
  pdfFile?: File;
  pdfUrl?: string;
  pagesCount?: number;
}

export interface KyHoSoSignatureMeta {
  signerName: string;
  signTime: string;
  certSerial: string;
  caProvider: string;
  bhxhCode: string;
  signatureValue?: string;
  isXmlSigned?: boolean;
}
