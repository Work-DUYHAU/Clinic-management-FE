import React from "react";
import type {
  Hs01TongHopItem,
  SendHs01GatewayResult,
} from "../services/hs01TongHopService";
import {
  generateHs01Xml,
  xmlToBase64,
  downloadHs01XmlFile,
  sendHs01ToBhxhGateway,
} from "../services/hs01TongHopService";
import { XmlExportModal } from "../../../common";
import { useXmlExportModal } from "../../../../hooks";
import { DEFAULT_MA_CSKCB } from "../../../../utils/shared/excelXmlShared";

import type { SourceFileUploadInfo } from "../../../common";

export interface Hs01XmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Hs01TongHopItem[];
  defaultTab?: "base64" | "smartca";
  activeTab?: "base64" | "smartca";
  onSendSuccess?: (result: SendHs01GatewayResult) => void;
  fileUploadStats?: SourceFileUploadInfo | null;
}

const generateHs01XmlHandler = (items: Hs01TongHopItem[]) => {
  return generateHs01Xml(items, DEFAULT_MA_CSKCB);
};

const generateHs01Base64Handler = (_items: Hs01TongHopItem[], xml?: string) => {
  return xml ? xmlToBase64(xml) : "";
};

const downloadHs01FileHandler = (items: Hs01TongHopItem[]) => {
  const firstItem = items[0];
  const namQt = firstItem?.namQt || new Date().getFullYear();
  const thangQt = String(
    firstItem?.thangQt || new Date().getMonth() + 1,
  ).padStart(2, "0");
  const kyQT = `${namQt}${thangQt}`;
  const fileName = `HSTH01BH_${DEFAULT_MA_CSKCB}_${kyQT}.xml`;
  downloadHs01XmlFile(items, DEFAULT_MA_CSKCB, fileName);
};

const sendHs01GatewayHandler = (
  items: Hs01TongHopItem[],
  signature?: any,
  fileBase64?: string,
) => {
  return sendHs01ToBhxhGateway(items, undefined, signature, fileBase64);
};

const getHs01SendSuccessMessage = (res: SendHs01GatewayResult) => {
  const kyQtStr =
    res.kyQT && res.kyQT.length === 6
      ? ` (Kỳ QT: ${res.kyQT.slice(4)}/${res.kyQT.slice(0, 4)})`
      : "";
  return `Tiếp nhận thành công ${res.totalRecords} hồ sơ tổng hợp 01/BH${kyQtStr}!\nMã giao dịch: ${res.maGiaoDich}`;
};

export const Hs01XmlModal: React.FC<Hs01XmlModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultTab,
  activeTab = "smartca",
  onSendSuccess,
  fileUploadStats,
}) => {
  // Trích xuất kỳ quyết toán từ dữ liệu hồ sơ thực tế (NAM_QT & THANG_QT từ file)
  const firstItem = items[0];
  const namQt = firstItem?.namQt || new Date().getFullYear();
  const thangQt = String(
    firstItem?.thangQt || new Date().getMonth() + 1,
  ).padStart(2, "0");
  const kyQT = `${namQt}${thangQt}`;
  const defaultFileName = `HSTH01BH_${DEFAULT_MA_CSKCB}_${kyQT}.xml`;

  const {
    tab,
    setTab,
    isSending,
    sendResult,
    xmlContent,
    base64Content,
    handleDownloadXml,
    handleSendGateway,
    handleResetSendResult,
  } = useXmlExportModal<Hs01TongHopItem, SendHs01GatewayResult>({
    isOpen,
    items,
    defaultTab: defaultTab || activeTab,
    generateXml: generateHs01XmlHandler,
    generateBase64: generateHs01Base64Handler,
    downloadFile: downloadHs01FileHandler,
    sendGateway: sendHs01GatewayHandler,
    downloadSuccessMessage: "Đã tải xuống tệp XML Mẫu 01/BH thành công!",
    emptyItemsMessage: "Không có hồ sơ nào để gửi!",
    getSendSuccessMessage: getHs01SendSuccessMessage,
    onSendSuccess,
  });

  return (
    <XmlExportModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xuất XML & Cổng Giám Định BHYT (Mẫu 01/BH)"
      loaiHsBadge="Loại HS 5 - GuiHoSoTongHop01BH"
      itemsCount={items.length}
      itemLabel="hồ sơ tổng hợp"
      xmlContent={xmlContent}
      base64Content={base64Content}
      loaiHsCode="5"
      tab={tab}
      onTabChange={setTab}
      onExportXml={handleDownloadXml}
      onSendApi={handleSendGateway}
      isSendingApi={isSending}
      apiResponse={sendResult}
      onResetApiResponse={handleResetSendResult}
      customFileName={defaultFileName}
      sourceFileInfo={fileUploadStats}
    />
  );
};
