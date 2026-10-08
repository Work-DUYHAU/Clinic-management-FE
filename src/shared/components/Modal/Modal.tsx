import type { FC } from "react";
import { Modal as AntModal } from "antd";
import type { AppModalProps } from "./Modal.types";

const Modal: FC<AppModalProps> = ({
  show,
  open,
  onHide,
  onCancel,
  onConfirm,
  onOk,
  confirmText,
  okText,
  confirmLoading,
  children,
  centered = true,
  ...rest
}) => {
  return (
    <AntModal
      open={open ?? show}
      onCancel={onCancel ?? onHide}
      onOk={onOk ?? onConfirm}
      okText={okText ?? confirmText}
      confirmLoading={confirmLoading}
      centered={centered}
      {...rest}
    >
      {children}
    </AntModal>
  );
};

export default Modal;
