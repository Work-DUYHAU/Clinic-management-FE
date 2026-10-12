import React from "react";
import type { HoSoDieuChinh09Item } from "../../../types/hs09DieuChinhTypes";
import {
  Hs09Dropzone,
  Hs09Table,
  Hs09EditModal,
  Hs09XmlModal,
  Hs09DetailModal,
  Hs09HanhChinhModal,
  Hs09ChiPhiModal,
  Hs09AttachmentModal,
  Hs09PrintPdfModal,
} from "./components";
import { useHs09DieuChinhTab } from "./hooks";

interface Hs09DieuChinhTabProps {
  items?: HoSoDieuChinh09Item[];
  onItemsChange?: (
    updater:
      | HoSoDieuChinh09Item[]
      | ((prev: HoSoDieuChinh09Item[]) => HoSoDieuChinh09Item[]),
  ) => void;
}

export const Hs09DieuChinhTab: React.FC<Hs09DieuChinhTabProps> = ({
  items: propItems,
  onItemsChange,
}) => {
  const {
    items,
    filteredItems,
    searchTerm,
    setSearchTerm,
    filterNhomLoi,
    setFilterNhomLoi,
    filterSoBangXml,
    setFilterSoBangXml,
    filterTrangThai,
    setFilterTrangThai,
    filterTinhTrangGui,
    setFilterTinhTrangGui,
    filterLoaiThaoTac,
    setFilterLoaiThaoTac,
    filterKyQt,
    setFilterKyQt,
    filterTuNgay,
    setFilterTuNgay,
    filterDenNgay,
    setFilterDenNgay,
    isLoadingFile,
    fileUploadStats,
    isXmlModalOpen,
    xmlModalTab,
    isEditModalOpen,
    editingItem,
    isDetailModalOpen,
    detailItem,
    isHanhChinhModalOpen,
    hanhChinhItem,
    isChiPhiModalOpen,
    chiPhiItem,
    isAttachmentModalOpen,
    attachmentItem,
    isPrintPdfModalOpen,
    printPdfItem,
    signingItems,
    selectedTableItems,
    setSelectedTableItems,
    openSignModal,
    handleFileUpload,
    handleSwitchSheet,
    handleDownloadTemplate,
    handleClearData,
    handleAddNew,
    handleEdit,
    handleDelete,
    handleSaveItem,
    handleViewDetail,
    handleBulkSign,
    handleUnsign,
    handleSendSuccess,
    handleSignSuccess,
    handleOpenHanhChinh,
    handleCloseHanhChinh,
    handleOpenChiPhi,
    handleCloseChiPhi,
    handleOpenAttachment,
    handleCloseAttachment,
    handleUpdateItem,
    handlePrintPdf,
    handleClosePrintPdf,
    handleExportExcel,
    handleSendGiamDinh,
    handleHuyPhien,
    handleCloseEditModal,
    handleCloseDetailModal,
    handleCloseXmlModal,
  } = useHs09DieuChinhTab({ items: propItems, onItemsChange });

  return (
    <div className="space-y-3">
      {/* 2. Dropzone & Action Toolbar */}
      <Hs09Dropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={items.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={handleDownloadTemplate}
        onClearData={handleClearData}
        onOpenXmlModal={() => openSignModal(selectedTableItems)}
        onOpenApiTab={() => openSignModal(selectedTableItems)}
        onAddNew={handleAddNew}
      />

      {/* 3. Main Data Table */}
      <Hs09Table
        items={filteredItems}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterNhomLoi={filterNhomLoi}
        onFilterNhomLoiChange={setFilterNhomLoi}
        filterSoBangXml={filterSoBangXml}
        onFilterSoBangXmlChange={setFilterSoBangXml}
        filterTrangThai={filterTrangThai}
        onFilterTrangThaiChange={setFilterTrangThai}
        filterTinhTrangGui={filterTinhTrangGui}
        onFilterTinhTrangGuiChange={setFilterTinhTrangGui}
        filterLoaiThaoTac={filterLoaiThaoTac}
        onFilterLoaiThaoTacChange={setFilterLoaiThaoTac}
        filterKyQt={filterKyQt}
        onFilterKyQtChange={setFilterKyQt}
        filterTuNgay={filterTuNgay}
        onFilterTuNgayChange={setFilterTuNgay}
        filterDenNgay={filterDenNgay}
        onFilterDenNgayChange={setFilterDenNgay}
        onAddNew={handleAddNew}
        onSelectionChange={setSelectedTableItems}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetail={handleViewDetail}
        onBulkSign={handleBulkSign}
        onUnsign={handleUnsign}
        onOpenHanhChinh={handleOpenHanhChinh}
        onOpenChiPhi={handleOpenChiPhi}
        onOpenAttachment={handleOpenAttachment}
        onPrintPdf={handlePrintPdf}
        onSendGiamDinh={handleSendGiamDinh}
        onExportExcel={handleExportExcel}
        onHuyPhien={handleHuyPhien}
      />

      {/* MODALS */}
      {/* 1. Modal Điều chỉnh thông tin hành chính (Mục 3.1) */}
      <Hs09HanhChinhModal
        isOpen={isHanhChinhModalOpen}
        onClose={handleCloseHanhChinh}
        item={hanhChinhItem}
        onSave={handleUpdateItem}
      />

      {/* 2. Modal Điều chỉnh chi phí (Mục 3.2, 3.3, 3.4) */}
      <Hs09ChiPhiModal
        isOpen={isChiPhiModalOpen}
        onClose={handleCloseChiPhi}
        item={chiPhiItem}
        onSave={handleUpdateItem}
      />

      {/* 3. Modal Đính kèm tài liệu chứng minh (Mục 8) */}
      <Hs09AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={handleCloseAttachment}
        item={attachmentItem}
        onSave={handleUpdateItem}
      />

      {/* 4. Modal In Mẫu số 09/BH (Mục 4.2) */}
      <Hs09PrintPdfModal
        isOpen={isPrintPdfModalOpen}
        onClose={handleClosePrintPdf}
        item={printPdfItem}
      />

      {/* 5. Modal Sửa Tổng Quát */}
      <Hs09EditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveItem}
        initialData={editingItem}
        totalItemsCount={items.length}
      />

      {/* 6. Detail Modal XML gốc */}
      <Hs09DetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        item={detailItem}
      />

      {/* 7. XML / Base64 / SmartCA Modal */}
      <Hs09XmlModal
        isOpen={isXmlModalOpen}
        onClose={handleCloseXmlModal}
        items={signingItems}
        defaultTab={xmlModalTab}
        onSendSuccess={handleSendSuccess}
        onSignSuccess={handleSignSuccess}
        fileUploadStats={fileUploadStats}
      />
    </div>
  );
};
