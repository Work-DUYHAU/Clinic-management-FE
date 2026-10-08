import type { ReactNode } from "react";
import type { DatePickerProps as AntDatePickerProps } from "antd";

export interface AppDatePickerProps extends AntDatePickerProps {
  label?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}
