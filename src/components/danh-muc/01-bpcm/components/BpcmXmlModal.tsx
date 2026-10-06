import React from 'react';
import type { DmBpcmItem } from '../../../../types';
import {
  generateBpcmXml,
  xmlToBase64,
  downloadXmlFile,
  sendBpcmToBhxhGateway,
} from '../../../../utils/bpcmXmlEngine';
import { XmlExportModal } from '../../../common';
import { useXmlExportModal } from '../../../../hooks';
import { DEFAULT_MA_CSKCB } from '../../../../utils/shared/excelXmlShared';
import type { GatewaySendResult } from '../../../../utils/shared/excelXmlShared';

import type { SourceFileUploadInfo } from '../../../common';

export interface BpcmXmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DmBpcmItem[];
  defaultTab?: 'base64' | 'smartca';
  onSendSuccess?: (result: GatewaySendResult) => void;
  fileUploadStats?: SourceFileUploadInfo | null;
}

export const BpcmXmlModal: React.FC<BpcmXmlModalProps> = ({
  isOpen,
  onClose,
  items,
  defaultTab = 'smartca',
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
    handleResetSendResult,
  } = useXmlExportModal<DmBpcmItem, GatewaySendResult>({
    isOpen,
    items,
    defaultTab,
    generateXml: generateBpcmXml,
    generateBase64: (_items, xml) => (xml ? xmlToBase64(xml) : ''),
    downloadFile: (_items, xml) =>
      downloadXmlFile(xml || generateBpcmXml(items), `DanhMuc01_BPCMKBCB_${DEFAULT_MA_CSKCB}.xml`),
    sendGateway: sendBpcmToBhxhGateway,
    downloadSuccessMessage: 'Đã tải xuống file XML Mẫu 01/DM chuẩn Loại hồ sơ 70',
    getSendSuccessMessage: (res) =>
      `Cổng tiếp nhận thành công! Mã GD: ${res.maGiaoDich}`,
    onSendSuccess,
  });

  return (
    <XmlExportModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu Trúc XML & Chuỗi Base64 Ký Số Mẫu 01/DM (Khoa Phòng / BPCM)"
      loaiHsBadge="Loại HS 70 - GuiDanhMuc01_BPCMKBCB"
      itemsCount={items.length}
      itemLabel="khoa phòng / bàn khám"
      xmlContent={xmlContent}
      base64Content={base64Content}
      loaiHsCode="70"
      tab={tab}
      onTabChange={setTab}
      onExportXml={handleDownloadXml}
      onSendApi={handleSendGateway}
      isSendingApi={isSending}
      apiResponse={sendResult}
      onResetApiResponse={handleResetSendResult}
      customFileName={`DM01_BPCMKBCB_${DEFAULT_MA_CSKCB}.xml`}
      enableSmartCa
      sourceFileInfo={fileUploadStats}
    />
  );
};
