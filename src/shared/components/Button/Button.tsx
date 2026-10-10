import type { FC } from "react";
import { Button as AntButton } from "antd";
import type { AppButtonProps } from "./Button.types";
import "./Button.css";

const Button: FC<AppButtonProps> = ({
  label,
  isLoading,
  loading,
  leftIcon,
  rightIcon,
  children,
  icon,
  variant,
  className,
  ...rest
}) => {
  const variantClass = variant ? `btn-${variant}` : "";
  const finalClassName = [variantClass, className].filter(Boolean).join(" ");

  return (
    <AntButton
      loading={isLoading ?? loading}
      icon={leftIcon ?? icon}
      className={finalClassName || undefined}
      {...rest}
    >
      {(label || children) && <span>{label || children}</span>}
      {rightIcon}
    </AntButton>
  );
};

export default Button;