import type { FC } from "react";
import { Dropdown as AntDropdown } from "antd";
import type { AppDropdownProps } from "./Dropdown.types";

const Dropdown: FC<AppDropdownProps> = ({
  items,
  menu,
  children,
  ...rest
}) => {
  return (
    <AntDropdown menu={menu ?? (items ? { items } : undefined)} {...rest}>
      {children}
    </AntDropdown>
  );
};

export default Dropdown;