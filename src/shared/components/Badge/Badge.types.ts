import type { ReactNode } from "react";
import type { BadgeProps as AntBadgeProps } from "antd";

export interface AppBadgeProps extends AntBadgeProps {
  label?: ReactNode;
}