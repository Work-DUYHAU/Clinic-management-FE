import type { FC } from "react";
import { Button as AntButton } from "antd";
import type { AppButtonProps } from "./Button.types";

const Button: FC<AppButtonProps> = ({
  label,
  isLoading,
  loading,
  leftIcon,
  rightIcon,
  children,
  icon,
  ...rest
}) => {
  return (
    <AntButton
      loading={isLoading ?? loading}
      icon={leftIcon ?? icon}
      {...rest}
    >
      {(label || children) && <span>{label || children}</span>}
      {rightIcon}
    </AntButton>
  );
};

export default Button;