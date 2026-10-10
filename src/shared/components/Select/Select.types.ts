import type { ReactNode } from "react";
import type { SelectProps as AntSelectProps } from "antd";

export interface AppSelectProps extends AntSelectProps {
  label?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
  /**
   * Tùy chỉnh chiều cao của Select (đơn vị px nếu là number, hoặc chuỗi CSS)
   * Ví dụ: height={38},width={180} || width="100%"
   */
  height?: number | string;
  width?: number | string;
}
