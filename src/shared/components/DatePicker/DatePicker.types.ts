import type { ReactNode } from "react";
import type {
  DatePickerProps as AntDatePickerProps,
  GetProps,
  DatePicker as AntDatePicker,
} from "antd";

export interface AppDatePickerProps extends AntDatePickerProps {
  label?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
}

export type AppRangePickerProps = GetProps<typeof AntDatePicker.RangePicker> & {
  label?: ReactNode;
  error?: ReactNode;
  containerClassName?: string;
  labelClassName?: string;
};
