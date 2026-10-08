import type { ReactNode } from "react";
import type { ButtonProps as AntButtonProps } from "antd";

export interface AppButtonProps extends AntButtonProps {
  label?: ReactNode;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}