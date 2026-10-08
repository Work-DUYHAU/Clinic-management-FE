import type { FC } from "react";
import { DatePicker as AntDatePicker } from "antd";
import clsx from "clsx";
import type { AppDatePickerProps } from "./DatePicker.types";

const DatePicker: FC<AppDatePickerProps> = ({
  label,
  error,
  status,
  containerClassName,
  labelClassName,
  className,
  ...rest
}) => {
  return (
    <div className={clsx("mb-3", containerClassName)}>
      {label && (
        <label className={clsx("mb-1 block text-sm font-medium text-slate-700", labelClassName)}>
          {label}
        </label>
      )}

      <AntDatePicker
        status={error ? "error" : status}
        className={clsx("w-full", className)}
        {...rest}
      />

      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
};

export default DatePicker;
