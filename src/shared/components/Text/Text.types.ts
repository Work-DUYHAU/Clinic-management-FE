import type { TextProps as AntTextProps } from "antd/es/typography/Text";
import type { ElementType, ReactNode } from "react";

export interface AppTextProps extends AntTextProps {
  as?: ElementType;
  children?: ReactNode;
}