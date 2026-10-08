import { forwardRef } from "react";
import { Input as AntInput } from "antd";
import clsx from "clsx";
import type { AppInputProps, InputRef } from "./Input.types";

const Input = forwardRef<InputRef, AppInputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      containerClassName,
      labelClassName,
      helperClassName,
      errorClassName,
      className,
      status,
      ...rest
    },
    ref
  ) => {
    return (
      <div className={clsx("mb-3", containerClassName)}>
        {label && <label className={clsx("mb-1 block text-sm font-medium text-slate-700", labelClassName)}>{label}</label>}

        <AntInput
          ref={ref}
          prefix={leftIcon}
          suffix={rightIcon}
          status={error ? "error" : status}
          className={className}
          {...rest}
        />

        {error && <div className={clsx("text-xs text-red-500 mt-1", errorClassName)}>{error}</div>}
        {helperText && !error && <div className={clsx("text-xs text-slate-500 mt-1", helperClassName)}>{helperText}</div>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
export { Input };