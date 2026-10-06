import React from 'react';
import type { DmThietBiItem } from '../../../../types';
import {
  generateThietBiXml,
  downloadThietBiXmlFile,
  sendThietBiToBhxhGateway,
} from '../../../../utils/thietBiXmlEngine';
import type { SendThietBiGatewayResult } from '../../../../types/thietBiTypes';
import { xmlToBase64, DEFAULT_MA_CSKCB } from '../../../../utils/shared/excelXmlShared';
import { XmlExportModal } from '../../../common';
import { useXmlExportModal } from '../../../../hooks';

import type { SourceFileUploadInfo } from '../../../common';

export interface ThietBiXmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DmThietBiItem[];
  defaultTab?: 'base64' | 'smartca';
  onSendSuccess?: (result: SendThietBiGatewayResult) => void;
  fileUploadStats?: SourceFileUploadInfo | null;
}

export const ThietBiXmlModal: React.FC<ThietBiXmlModalProps> = ({
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
  } = useXmlExportModal<DmThietBiItem, SendThietBiGatewayResult>({
    isOpen,
    items,
    defaultTab,
    generateXml: generateThietBiXml,
    generateBase64: (_items, xml) => (xml ? xmlToBase64(xml) : ''),
    downloadFile: (_items, xml) => {
      downloadThietBiXmlFile(xml || generateThietBiXml(items), `DM04_THIETBIKBCB_${DEFAULT_MA_CSKCB}.xml`);
    },
    sendGateway: sendThietBiToBhxhGateway,
    downloadSuccessMessage: 'Đã tải xuống file XML Mẫu 04/DM chuẩn Loại hồ sơ 72',
    getSendSuccessMessage: (res) =>
      `Cổng tiếp nhận thành công! Mã GD: ${res.maGiaoDich}`,
    onSendSuccess,
  });

  return (
    <XmlExportModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu Trúc XML & Chuỗi Base64 Ký Số Mẫu 04/DM"
      loaiHsBadge="Loại HS 11 - GuiDanhMuc04_DMVTYT"
      itemsCount={items.length}
      itemLabel="vật tư / thiết bị"
      xmlContent={xmlContent}
      base64Content={base64Content}
      loaiHsCode="11"
      tab={tab}
      onTabChange={setTab}
      onExportXml={handleDownloadXml}
      onSendApi={handleSendGateway}
      isSendingApi={isSending}
      apiResponse={sendResult}
      customFileName={`DM04_DMVTYT_${DEFAULT_MA_CSKCB}.xml`}
      enableSmartCa
      sourceFileInfo={fileUploadStats}
    />
  );
};
