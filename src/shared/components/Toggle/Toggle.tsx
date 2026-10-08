import type { FC } from "react";
import { Switch } from "antd";
import clsx from "clsx";
import type { AppToggleProps } from "./Toggle.types";

const Toggle: FC<AppToggleProps> = ({ label, className, ...rest }) => {
  return (
    <div className={clsx("inline-flex items-center gap-2", className)}>
      <Switch {...rest} />
      {label && <span className="text-sm text-slate-700 select-none">{label}</span>}
    </div>
  );
};

export default Toggle;