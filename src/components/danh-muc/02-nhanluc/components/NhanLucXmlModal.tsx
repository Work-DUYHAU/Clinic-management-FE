import React from 'react';
import type { DmNhanLucItem } from '../../../../types';
import {
  generateNhanLucXml,
  xmlToBase64,
  downloadNhanLucXmlFile,
  sendNhanLucToBhxhGateway,
} from '../../../../utils/nhanlucXmlEngine';
import type { SendNhanLucGatewayResult } from '../../../../types/nhanLucTypes';
import { XmlExportModal } from '../../../common';
import { useXmlExportModal } from '../../../../hooks';
import { DEFAULT_MA_CSKCB } from '../../../../utils/shared/excelXmlShared';

import type { SourceFileUploadInfo } from '../../../common';

export interface NhanLucXmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DmNhanLucItem[];
  defaultTab?: 'base64' | 'smartca';
  onSendSuccess?: (result: SendNhanLucGatewayResult) => void;
  fileUploadStats?: SourceFileUploadInfo | null;
}

export const NhanLucXmlModal: React.FC<NhanLucXmlModalProps> = ({
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
  } = useXmlExportModal<DmNhanLucItem, SendNhanLucGatewayResult>({
    isOpen,
    items,
    defaultTab,
    generateXml: generateNhanLucXml,
    generateBase64: (_items, xml) => (xml ? xmlToBase64(xml) : ''),
    downloadFile: (_items, xml) => {
      if (xml) {
        downloadNhanLucXmlFile(xml, `DanhMuc02_NHANLUCKBCB_${DEFAULT_MA_CSKCB}.xml`);
      } else {
        downloadNhanLucXmlFile(generateNhanLucXml(items), `DanhMuc02_NHANLUCKBCB_${DEFAULT_MA_CSKCB}.xml`);
      }
    },
    sendGateway: sendNhanLucToBhxhGateway,
    downloadSuccessMessage: 'Đã tải xuống file XML Mẫu 02/DM chuẩn Loại hồ sơ 71',
    getSendSuccessMessage: (res) =>
      `Cổng tiếp nhận thành công! Mã GD: ${res.maGiaoDich}`,
    onSendSuccess,
  });

  return (
    <XmlExportModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu Trúc XML & Chuỗi Base64 Ký Số Mẫu 02/DM"
      loaiHsBadge="Loại HS 71 - GuiDanhMuc02_NLKCB"
      itemsCount={items.length}
      itemLabel="nhân lực y tế"
      xmlContent={xmlContent}
      base64Content={base64Content}
      loaiHsCode="71"
      tab={tab}
      onTabChange={setTab}
      onExportXml={handleDownloadXml}
      onSendApi={handleSendGateway}
      isSendingApi={isSending}
      apiResponse={sendResult}
      customFileName={`DM02_NLKCB_${DEFAULT_MA_CSKCB}.xml`}
      enableSmartCa
      sourceFileInfo={fileUploadStats}
    />
  );
};
