import type { ReactNode } from "react";
import type { SelectProps as AntSelectProps } from "antd";

export interface AppSelectProps extends AntSelectProps {
  label?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}
