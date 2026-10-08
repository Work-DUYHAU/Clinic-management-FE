import type { DropdownProps as AntDropdownProps, MenuProps } from "antd";

export interface AppDropdownProps extends AntDropdownProps {
  items?: MenuProps["items"];
}

export type { MenuProps };