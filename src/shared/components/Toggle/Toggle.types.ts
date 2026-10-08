import type { ReactNode } from "react";
import type { SwitchProps } from "antd";

export interface AppToggleProps extends SwitchProps {
  label?: ReactNode;
}