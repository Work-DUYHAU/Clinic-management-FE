import type { ReactNode } from "react";
import type { TooltipProps } from "antd";
import type { AppButtonProps } from "../Button/Button.types";

export interface AppIconButtonProps extends Omit<AppButtonProps, "children" | "label"> {
  icon: ReactNode;
  tooltip?: ReactNode;
  tooltipPlacement?: TooltipProps["placement"];
}