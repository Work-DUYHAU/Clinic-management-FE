import type { FC } from "react";
import { Select as AntSelect } from "antd";
import clsx from "clsx";
import type { AppSelectProps } from "./Select.types";

const Select: FC<AppSelectProps> = ({
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

      <AntSelect
        status={error ? "error" : status}
        className={clsx("w-full", className)}
        {...rest}
      />

      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
};

export default Select;
