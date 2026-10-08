import type { FC } from "react";
import { Tooltip } from "antd";
import Button from "../Button";
import type { AppIconButtonProps } from "./IconButton.types";

const IconButton: FC<AppIconButtonProps> = ({
  icon,
  tooltip,
  tooltipPlacement = "top",
  ...rest
}) => {
  const btn = <Button icon={icon} {...rest} />;

  if (tooltip) {
    return (
      <Tooltip title={tooltip} placement={tooltipPlacement}>
        {btn}
      </Tooltip>
    );
  }

  return btn;
};

export default IconButton;