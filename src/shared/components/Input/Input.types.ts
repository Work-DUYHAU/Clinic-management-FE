import type { ReactNode } from "react";
import type { InputProps as AntInputProps, InputRef } from "antd";

export interface AppInputProps extends AntInputProps {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  helperClassName?: string;
  errorClassName?: string;
}

export type { InputRef };