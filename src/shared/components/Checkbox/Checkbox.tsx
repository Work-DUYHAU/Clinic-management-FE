import { forwardRef } from "react";
import { Checkbox as AntCheckbox } from "antd";
import type { AppCheckboxProps, CheckboxRef } from "./Checkbox.types";

const Checkbox = forwardRef<CheckboxRef, AppCheckboxProps>(
  ({ label, children, ...rest }, ref) => {
    return (
      <AntCheckbox ref={ref} {...rest}>
        {label ?? children}
      </AntCheckbox>
    );
  }
);

Checkbox.displayName = "Checkbox";
export default Checkbox;