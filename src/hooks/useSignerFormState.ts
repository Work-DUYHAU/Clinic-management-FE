import { useState, useCallback } from "react";
import { useSmartCa } from "../context/SmartCaContext";
import {
  type IdentityType,
  sanitizeIdentityInput,
} from "../utils/validators";

const DEFAULT_MST =
  import.meta.env.VITE_SMARTCA_DEFAULT_MST ||
  import.meta.env.VITE_SMARTCA_USER_ID ||
  "";
const DEFAULT_PASSWORD = import.meta.env.VITE_SMARTCA_PASSWORD || "";

export interface SignerFormState {
  signerName: string;
  setSignerName: React.Dispatch<React.SetStateAction<string>>;
  signerEmail: string;
  setSignerEmail: React.Dispatch<React.SetStateAction<string>>;
  idType: IdentityType;
  setIdType: React.Dispatch<React.SetStateAction<IdentityType>>;
  identityValue: string;
  setIdentityValue: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  handleIdentityChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectIdType: (type: IdentityType) => void;
}

export function useSignerFormState(): SignerFormState {
  const { config } = useSmartCa();
  const defaultMst = DEFAULT_MST || config?.username || "";

  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [idType, setIdType] = useState<IdentityType>(
    defaultMst ? "mst" : "phone",
  );
  const [identityValue, setIdentityValue] = useState(defaultMst);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);

  const handleIdentityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = sanitizeIdentityInput(e.target.value, idType);
      setIdentityValue(raw);
    },
    [idType],
  );

  const handleSelectIdType = useCallback(
    (type: IdentityType) => {
      if (idType !== type) {
        setIdType(type);
        if (type === "mst" && defaultMst) {
          setIdentityValue(defaultMst);
        } else {
          setIdentityValue("");
        }
      }
    },
    [idType, defaultMst],
  );

  return {
    signerName,
    setSignerName,
    signerEmail,
    setSignerEmail,
    idType,
    setIdType,
    identityValue,
    setIdentityValue,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    handleIdentityChange,
    handleSelectIdType,
  };
}
