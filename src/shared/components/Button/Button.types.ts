import type { ReactNode } from "react";
import type { ButtonProps as AntButtonProps } from "antd";

export type AppButtonVariant =
  | "primary"
  | "success"
  | "indigo"
  | "warning"
  | "danger"
  | "excel"
  | "sky"
  | "teal"
  | "neutral"
  | "soft-indigo"
  | "soft-blue"
  | "print";

export interface AppButtonProps extends Omit<AntButtonProps, "variant"> {
  label?: ReactNode;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: AppButtonVariant;
}