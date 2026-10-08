import type { ReactNode } from "react";
import type { CheckboxProps as AntCheckboxProps, CheckboxRef } from "antd";

export interface AppCheckboxProps extends AntCheckboxProps {
  label?: ReactNode;
}

export type { CheckboxRef };