import React from "react";
import type { DmThuocItem } from "../../../../types";
import {
  generateThuocXml,
  xmlToBase64,
  downloadThuocXmlFile,
  sendThuocToBhxhGateway,
  type SendThuocGatewayResult,
} from "../services/thuocService";
import { XmlExportModal } from "../../../common";
import { useXmlExportModal } from "../../../../hooks";
import { DEFAULT_MA_CSKCB } from "../../../../utils/shared/excelXmlShared";

import type { SourceFileUploadInfo } from "../../../common";

export interface ThuocXmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DmThuocItem[];
  defaultTab?: "base64" | "smartca";
  onSendSuccess?: (result: SendThuocGatewayResult) => void;
  fileUploadStats?: SourceFileUploadInfo | null;
}

export const ThuocXmlModal: React.FC<ThuocXmlModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultTab = "smartca",
  onSendSuccess,
  fileUploadStats,
}) => {
  const {
    tab,
    setTab,
    isSending,
    sendResult,
    xmlContent,
    base64Content,
    handleDownloadXml,
    handleSendGateway,
  } = useXmlExportModal<DmThuocItem, SendThuocGatewayResult>({
    isOpen,
    items,
    defaultTab,
    generateXml: generateThuocXml,
    generateBase64: (_items, xml) => (xml ? xmlToBase64(xml) : ""),
    downloadFile: (itemsToDownload, xml) =>
      downloadThuocXmlFile(
        xml || generateThuocXml(itemsToDownload),
        `DM03_DMTHUOC_${DEFAULT_MA_CSKCB}.xml`,
      ),
    sendGateway: sendThuocToBhxhGateway,
    downloadSuccessMessage: "Đã tải xuống file XML Mẫu 03/DM chuẩn Loại hồ sơ 10",
    getSendSuccessMessage: (res) =>
      `Cổng tiếp nhận thành công! Mã GD: ${res.maGiaoDich}`,
    onSendSuccess,
  });

  return (
    <XmlExportModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu Trúc XML & Chuỗi Base64 Ký Số Mẫu 03/DM (Danh Mục Thuốc)"
      loaiHsBadge="Loại HS 10 - GuiDanhMuc03_DMTHUOC"
      itemsCount={items.length}
      itemLabel="mặt hàng thuốc / chế phẩm máu"
      xmlContent={xmlContent}
      base64Content={base64Content}
      loaiHsCode="10"
      tab={tab}
      onTabChange={setTab}
      onExportXml={handleDownloadXml}
      onSendApi={handleSendGateway}
      isSendingApi={isSending}
      apiResponse={sendResult}
      customFileName={`DM03_DMTHUOC_${DEFAULT_MA_CSKCB}.xml`}
      enableSmartCa
      sourceFileInfo={fileUploadStats}
    />
  );
};
