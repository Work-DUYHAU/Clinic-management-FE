import type { ReactNode } from "react";
import type { AlertProps as AntAlertProps } from "antd";

export interface AppAlertProps extends Omit<AntAlertProps, "message" | "description"> {
  title?: ReactNode;
  message?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}
