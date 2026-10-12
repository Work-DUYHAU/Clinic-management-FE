import React from "react";
import {
  Hs01Dropzone,
  Hs01Table,
  Hs01EditModal,
  Hs01XmlModal,
  Hs01DetailModal,
} from "./components";
import { useHs01TongHopTab } from "./hooks";

export const Hs01TongHopTab: React.FC = () => {
  const {
    items,
    filteredItems,
    searchTerm,
    setSearchTerm,
    filterLoaiKcb,
    setFilterLoaiKcb,
    filterTrangThai,
    setFilterTrangThai,
    isLoadingFile,
    fileUploadStats,
    isXmlModalOpen,
    xmlModalTab,
    isEditModalOpen,
    editingItem,
    isDetailModalOpen,
    detailItem,
    // Event handlers
    handleFileUpload,
    handleSwitchSheet,
    handleDownloadTemplate,
    handleClearData,
    handleAddNew,
    handleEdit,
    handleDelete,
    handleSaveItem,
    handleViewDetail,
    handleSendSuccess,
    handleOpenXmlModal,
    handleOpenApiTab,
    handleCloseXmlModal,
    handleCloseEditModal,
    handleCloseDetailModal,
  } = useHs01TongHopTab();

  return (
    <div className="space-y-6">
      {/* 2. Dropzone & Action Toolbar */}
      <Hs01Dropzone
        isLoadingFile={isLoadingFile}
        fileUploadStats={fileUploadStats}
        itemsCount={items.length}
        onFileUpload={handleFileUpload}
        onSwitchSheet={handleSwitchSheet}
        onDownloadTemplate={handleDownloadTemplate}
        onClearData={handleClearData}
        onOpenXmlModal={handleOpenXmlModal}
        onOpenApiTab={handleOpenApiTab}
        onAddNew={handleAddNew}
      />

      {/* 3. Main Data Table */}
      <Hs01Table
        items={filteredItems}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterLoaiKcb={filterLoaiKcb}
        onFilterLoaiKcbChange={setFilterLoaiKcb}
        filterTrangThai={filterTrangThai}
        onFilterTrangThaiChange={setFilterTrangThai}
        onAddNew={handleAddNew}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewDetail={handleViewDetail}
      />

      {/* MODALS */}
      {/* Edit / Add Modal */}
      <Hs01EditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveItem}
        initialData={editingItem}
        totalItemsCount={items.length}
      />

      {/* Detail Modal */}
      <Hs01DetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        item={detailItem}
      />

      {/* XML / Base64 / API Modal */}
      <Hs01XmlModal
        isOpen={isXmlModalOpen}
        onClose={handleCloseXmlModal}
        items={items}
        defaultTab={xmlModalTab}
        onSendSuccess={handleSendSuccess}
        fileUploadStats={fileUploadStats}
      />
    </div>
  );
};
