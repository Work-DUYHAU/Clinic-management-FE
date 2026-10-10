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
  style,
  height,
  width,
  ...rest
}) => {
  const hValue = typeof height === "number" ? `${height}px` : height;
  const wValue = typeof width === "number" ? `${width}px` : width;

  const dynamicStyle =
    hValue || wValue || style
      ? ({
          ...style,
          ...(wValue ? { width: wValue } : {}),
          ...(hValue
            ? {
                height: hValue,
                ["--select-h" as string]: hValue,
              }
            : {}),
        } as React.CSSProperties)
      : undefined;

  return (
    <div
      className={containerClassName}
      style={wValue ? { width: wValue } : undefined}
    >
      {label && (
        <label
          className={clsx(
            "mb-1 block text-sm font-medium text-slate-700",
            labelClassName,
          )}
        >
          {label}
        </label>
      )}

      <AntSelect
        status={error ? "error" : status}
        style={dynamicStyle}
        className={clsx(
          !wValue && "w-full",
          hValue &&
            "!h-[var(--select-h)] [&_.ant-select-selector]:!h-[var(--select-h)] [&_.ant-select-selector]:!min-h-[var(--select-h)] [&_.ant-select-selection-item]:!leading-[calc(var(--select-h)-2px)]",
          className,
        )}
        {...rest}
      />

      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
};

export default Select;
