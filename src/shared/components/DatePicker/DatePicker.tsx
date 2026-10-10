import type { FC } from "react";
import { DatePicker as AntDatePicker } from "antd";
import clsx from "clsx";
import type { AppDatePickerProps, AppRangePickerProps } from "./DatePicker.types";

const DatePickerBase: FC<AppDatePickerProps> = ({
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

const RangePicker: FC<AppRangePickerProps> = ({
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

      <AntDatePicker.RangePicker
        status={error ? "error" : status}
        className={clsx("w-full", className)}
        {...rest}
      />

      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
};

type CompoundedDatePicker = FC<AppDatePickerProps> & {
  RangePicker: FC<AppRangePickerProps>;
};

const DatePicker = DatePickerBase as CompoundedDatePicker;
DatePicker.RangePicker = RangePicker;

export default DatePicker;
