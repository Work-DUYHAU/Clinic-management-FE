import type { FC } from "react";
import { Alert as AntAlert } from "antd";
import type { AppAlertProps } from "./Alert.types";

const Alert: FC<AppAlertProps> = ({
  title,
  message,
  description,
  children,
  leftIcon,
  rightIcon,
  icon,
  showIcon,
  ...rest
}) => {
  const alertMessage = title ?? message ?? children;
  const alertDescription = title ? (description ?? message ?? children) : description;
  const customIcon = leftIcon ?? icon;

  return (
    <AntAlert
      message={alertMessage}
      description={alertDescription !== alertMessage ? alertDescription : undefined}
      showIcon={showIcon ?? Boolean(customIcon)}
      icon={customIcon}
      action={rightIcon}
      {...rest}
    />
  );
};

export default Alert;
