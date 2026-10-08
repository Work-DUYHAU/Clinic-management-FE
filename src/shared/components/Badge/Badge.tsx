import type { FC } from "react";
import { Badge as AntBadge } from "antd";
import type { AppBadgeProps } from "./Badge.types";

const Badge: FC<AppBadgeProps> = ({ label, children, ...rest }) => {
  return (
    <AntBadge {...rest}>
      {label ?? children}
    </AntBadge>
  );
};

export default Badge;