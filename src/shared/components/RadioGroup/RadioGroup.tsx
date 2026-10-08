import type { FC } from "react";
import { Radio } from "antd";
import clsx from "clsx";
import type { AppRadioGroupProps } from "./RadioGroup.types";

const RadioGroup: FC<AppRadioGroupProps> = ({
  label,
  error,
  inline = false,
  className,
  options,
  children,
  ...rest
}) => {
  return (
    <div className={clsx("mb-3", className)}>
      {label && <label className="block mb-1 text-sm font-medium text-slate-700">{label}</label>}

      <Radio.Group className={clsx(inline && "flex flex-wrap gap-3")} {...rest}>
        {options
          ? options.map((opt) => (
              <Radio key={String(opt.value)} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </Radio>
            ))
          : children}
      </Radio.Group>

      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
};

export default RadioGroup;