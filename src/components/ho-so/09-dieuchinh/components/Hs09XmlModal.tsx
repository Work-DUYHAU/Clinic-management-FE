import React from "react";
import type {
  HoSoDieuChinh09Item,
  SendHs09GatewayResult,
} from "../../../../types/hs09DieuChinhTypes";
import {
  generateHs09Xml,
  downloadHs09XmlFile,
  sendHs09ToBhxhGateway,
} from "../../../../utils/hs09DieuChinhXmlEngine";
import {
  xmlToBase64,
  DEFAULT_MA_CSKCB,
  getTodayYmd,
} from "../../../../utils/shared/excelXmlShared";
import { XmlExportModal } from "../../../common";
import { useXmlExportModal } from "../../../../hooks";

import type { SourceFileUploadInfo } from "../../../common";

export interface Hs09XmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: HoSoDieuChinh09Item[];
  defaultTab?: "base64" | "smartca";
  activeTab?: "base64" | "smartca";
  onSendSuccess?: (result: SendHs09GatewayResult) => void;
  onSignSuccess?: (
    items: HoSoDieuChinh09Item[],
    signedXml?: string,
    signResponse?: any,
  ) => void;
  fileUploadStats?: SourceFileUploadInfo | null;
}

const generateHs09Base64Handler = (
  _items: HoSoDieuChinh09Item[],
  xml?: string,
) => {
  return xml ? xmlToBase64(xml) : "";
};

const downloadHs09FileHandler = (
  items: HoSoDieuChinh09Item[],
  xml?: string,
) => {
  downloadHs09XmlFile(xml || items);
};

const sendHs09GatewayHandler = (
  items: HoSoDieuChinh09Item[],
  signature?: any,
  fileBase64?: string,
  onProgress?: (
    current: number,
    total: number,
    currentItem: HoSoDieuChinh09Item,
  ) => void,
) => {
  const invalidItems = items.filter((item) => item.isValid === false);
  if (invalidItems.length > 0) {
    const sampleIds = invalidItems
      .slice(0, 3)
      .map((item) => item.ttXml1.maLk || item.id)
      .join(", ");
    throw new Error(
      `Không thể gửi ${invalidItems.length} hồ sơ chưa hợp lệ. Kiểm tra mã liên kết: ${sampleIds}${invalidItems.length > 3 ? ", …" : ""}.`,
    );
  }
  return sendHs09ToBhxhGateway(items, undefined, signature, fileBase64, onProgress);
};

const getHs09SendSuccessMessage = (res: SendHs09GatewayResult) => {
  if (res.batchResults && res.batchResults.length > 1) {
    const successCount =
      res.successCount ??
      res.batchResults.filter((r) => r.maKetQua === "200").length;
    const total = res.totalRecords;
    if (successCount === total) {
      return `Đã tiếp nhận thành công toàn bộ ${total}/${total} hồ sơ điều chỉnh 09/BH lên Cổng Giám định BHYT!`;
    }
    return `Đã tiếp nhận ${successCount}/${total} hồ sơ thành công. Có ${total - successCount} hồ sơ bị từ chối.`;
  }
  const kyQtStr =
    res.kyQT && res.kyQT.length === 6
      ? ` (Kỳ QT: ${res.kyQT.slice(4)}/${res.kyQT.slice(0, 4)})`
      : "";
  return `Tiếp nhận thành công ${res.totalRecords} hồ sơ điều chỉnh 09/BH${kyQtStr}!\nMã giao dịch: ${res.maGiaoDich}`;
};

export const Hs09XmlModal: React.FC<Hs09XmlModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultTab,
  activeTab = "smartca",
  onSendSuccess,
  onSignSuccess,
  fileUploadStats,
}) => {
  const {
    tab,
    setTab,
    isSending,
    sendProgress,
    sendResult,
    xmlContent,
    base64Content,
    handleDownloadXml,
    handleSendGateway,
    handleResetSendResult,
    handleSignSuccess,
  } = useXmlExportModal<HoSoDieuChinh09Item, SendHs09GatewayResult>({
    isOpen,
    items,
    defaultTab: defaultTab || activeTab,
    generateXml: generateHs09Xml,
    generateBase64: generateHs09Base64Handler,
    downloadFile: downloadHs09FileHandler,
    sendGateway: sendHs09GatewayHandler,
    downloadSuccessMessage:
      "Đã tải xuống tệp XML Hồ sơ điều chỉnh Mẫu 09/BH thành công!",
    emptyItemsMessage: "Không có hồ sơ điều chỉnh nào để gửi!",
    getSendSuccessMessage: getHs09SendSuccessMessage,
    onSendSuccess,
    onSignSuccess: (signedItems, signedXml, signResponse) => {
      onSignSuccess?.(signedItems, signedXml, signResponse);
    },
  });

  const itemKyQt = items[0]?.ttXml1?.kyQt?.trim();
  const kyQT =
    itemKyQt && itemKyQt.length === 6 ? itemKyQt : getTodayYmd().slice(0, 6);
  const defaultFileName = `HSDC09BH_${DEFAULT_MA_CSKCB}_${kyQT}.xml`;
  const initialSignedXml =
    items.find((i) => (i as any).signedXml)?.signedXml || null;
  const initialSignedAt =
    items.find((i) => (i as any).signedAt)?.signedAt || null;

  return (
    <XmlExportModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xuất XML & Cổng Giám Định BHYT (Hồ Sơ Điều Chỉnh Mẫu 09/BH)"
      loaiHsBadge="Loại HS 73 - GuiHoSoDieuChinh09BH"
      itemsCount={items.length}
      itemLabel="hồ sơ điều chỉnh"
      xmlContent={xmlContent}
      base64Content={base64Content}
      loaiHsCode="73"
      customFileName={defaultFileName}
      tab={tab}
      onTabChange={setTab}
      onExportXml={handleDownloadXml}
      onSendApi={handleSendGateway}
      onSignSuccess={handleSignSuccess}
      initialSignedXml={initialSignedXml}
      initialSignedAt={initialSignedAt}
      isSendingApi={isSending}
      sendProgress={sendProgress}
      apiResponse={sendResult}
      onResetApiResponse={handleResetSendResult}
      sourceFileInfo={fileUploadStats}
    />
  );
};
