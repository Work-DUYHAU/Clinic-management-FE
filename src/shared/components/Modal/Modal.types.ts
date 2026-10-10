import type { ReactNode } from "react";
import type { ModalProps as AntModalProps } from "antd";

export interface AppModalProps extends Omit<
  AntModalProps,
  "open" | "title" | "footer"
> {
  show?: boolean;
  open?: boolean;
  title?: ReactNode;
  footer?: ReactNode;
  onHide?: () => void;
  onConfirm?: () => void;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  confirmLoading?: boolean;
}
