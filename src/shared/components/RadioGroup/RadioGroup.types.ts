import type { ReactNode } from "react";
import type { RadioGroupProps as AntRadioGroupProps } from "antd";

export interface RadioOption {
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
}

export interface AppRadioGroupProps extends Omit<AntRadioGroupProps, "options"> {
  label?: ReactNode;
  error?: ReactNode;
  options?: RadioOption[];
  inline?: boolean;
}