import type { FC } from "react";
import { Typography } from "antd";
import type { AppTextProps } from "./Text.types";

const { Text: AntText } = Typography;

const Text: FC<AppTextProps> = ({ children, ...rest }) => {
  return <AntText {...rest}>{children}</AntText>;
};

export default Text;