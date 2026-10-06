// ============================================================
// XMLDSig ENGINE - Động cơ ký số XML theo chuẩn W3C XMLDSig
// & Đặc tả ký số VNPT SmartCA / Quyết định 130 / BHXH Việt Nam 2025
// ============================================================

import { sha256Full } from "./hash";
import {
  formatXmlSigningTime,
  buildSignatureBlock,
} from "./shared/excelXmlShared";

export { formatXmlSigningTime, buildSignatureBlock };

export interface XmlDSigParams {
  signatureId?: string;
  digestValue: string;
  signatureValue: string;
  rsaModulus?: string;
  rsaExponent?: string;
  subjectDN: string;
  x509Certificate: string;
  signingTime?: string;
  /** Định dạng ký số: 'standard' (QĐ 130) hoặc 'bhxh2025' (Phụ lục 02 BHXH 2025) */
  signatureFormat?: "standard" | "bhxh2025";
  /** Id của thẻ dữ liệu cần trỏ tới (ví dụ: Id của <THONGTINHOSO>, <GIAYBAOTU>, <GIAYCHUNGSINH>) */
  targetDataId?: string;
  /** Mã băm SHA-256 của thẻ <Object> (nếu dùng format bhxh2025) */
  objectDigestValue?: string;
}

export interface ExtractedSignatureInfo {
  hasSignature: boolean;
  signatureId?: string;
  digestValue?: string;
  signatureValue?: string;
  subjectDN?: string;
  serialNumber?: string;
  signingTime?: string;
  targetDataId?: string;
  /** Danh sách tất cả các chữ ký trong tài liệu (hỗ trợ Countersign / Đa chữ ký) */
  signatures?: ExtractedSignatureInfo[];
  signatureCount?: number;
}

export interface CanonicalizeOptions {
  excludeSignatureId?: string;
  preserveOtherSignatures?: boolean;
}

export function minifyXml(xml: string): string {
  if (!xml) return "";
  return xml
    .replace(/\r\n/g, "")
    .replace(/\n/g, "")
    .replace(/>\s+</g, "><")
    .trim();
}

export function canonicalizeForDigest(
  xml: string,
  options?: CanonicalizeOptions | string,
): string {
  if (!xml) return "";
  const opts: CanonicalizeOptions =
    typeof options === "string"
      ? { excludeSignatureId: options, preserveOtherSignatures: true }
      : options || {};

  // Nén XML về 1 dòng không khoảng trắng giữa các thẻ để khớp 100% với C14N minified của Cổng BHXH
  let res = minifyXml(xml);

  // Loại bỏ khai báo XML declaration <?xml ...?> vì chuẩn W3C Canonical XML (C14N) không bao gồm XML declaration
  res = res.replace(/<\?xml[^>]*\?>/gi, "").trim();

  if (opts.preserveOtherSignatures) {
    if (opts.excludeSignatureId) {
      const targetSigRegex = new RegExp(
        `<Signature\\s+[^>]*Id="${opts.excludeSignatureId}"[\\s\\S]*?<\\/Signature>`,
        "gi",
      );
      res = res.replace(targetSigRegex, "");
    }
  } else {
    // Loại bỏ toàn bộ khối chữ ký <Signature>...</Signature> nếu đã có bên trong <CHUKYDONVI>
    res = res.replace(/<Signature[\s\S]*?<\/Signature>/gi, "");
  }

  // Chuẩn hóa toàn bộ thẻ tự đóng thành thẻ cặp mở/đóng theo chuẩn W3C C14N (ví dụ: <NGAY_VAO_NOI_TRU/> -> <NGAY_VAO_NOI_TRU></NGAY_VAO_NOI_TRU>, <CHUKYDONVI /> -> <CHUKYDONVI></CHUKYDONVI>)
  res = res.replace(/<([A-Za-z0-9_:-]+)([^>]*?)\s*\/>/g, "<$1$2></$1>");

  return res;
}

export async function computeXmlDigest(
  rawXml: string,
  options?: CanonicalizeOptions | string,
): Promise<{ digestValue: string; hexDigest: string }> {
  const cleanXml = canonicalizeForDigest(rawXml, options);
  const { base64, hex } = await sha256Full(cleanXml);
  return { digestValue: base64, hexDigest: hex };
}

export function extractRootNamespaces(rawXml?: string): string[] {
  const defaultNs = [
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema"',
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
  ];
  if (!rawXml) return defaultNs;
  const rootMatch = rawXml.match(/<([A-Za-z0-9_]+)([^>]*)>/);
  if (!rootMatch) return defaultNs;

  const attrs = rootMatch[2];
  const nsMatches = attrs.match(/xmlns:[A-Za-z0-9_]+="[^"]+"/g) || [];
  if (nsMatches.length === 0) return defaultNs;
  return Array.from(new Set(nsMatches)).sort();
}

export function buildCanonicalSignedInfo(
  documentDigest: string,
  rawXml?: string,
): string {
  const rootNs = extractRootNamespaces(rawXml);
  const nsString = [
    'xmlns="http://www.w3.org/2000/09/xmldsig#"',
    ...rootNs,
  ].join(" ");

  return `<SignedInfo ${nsString}><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod><DigestValue>${documentDigest.trim()}</DigestValue></Reference></SignedInfo>`;
}

export async function computeSignedInfoDigest(
  documentDigest: string,
  rawXml?: string,
): Promise<{
  digestValue: string;
  hexDigest: string;
  canonicalSignedInfo: string;
}> {
  const canonicalSignedInfo = buildCanonicalSignedInfo(documentDigest, rawXml);
  const { base64, hex } = await sha256Full(canonicalSignedInfo);
  return { digestValue: base64, hexDigest: hex, canonicalSignedInfo };
}

/**
 * Trích xuất RSA Modulus và Exponent từ chuỗi base64 của chứng thư số X.509 (DER ASN.1)
 */
export function extractRsaPublicKeyFromCert(
  certBase64: string,
): { modulus: string; exponent: string } | null {
  try {
    const cleanBase64 = certBase64.replace(/\s+/g, "");
    const binary = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));

    // Tìm OID RSA: 1.2.840.113549.1.1.1 (06 09 2a 86 48 86 f7 0d 01 01 01)
    const rsaOid = [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01];
    let oidIdx = -1;
    for (let i = 0; i <= binary.length - rsaOid.length; i++) {
      let match = true;
      for (let j = 0; j < rsaOid.length; j++) {
        if (binary[i + j] !== rsaOid[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        oidIdx = i;
        break;
      }
    }
    if (oidIdx === -1) return null;

    // Sau OID và tham số NULL (05 00), tìm BIT STRING (tag 0x03)
    let bitStringIdx = -1;
    for (let i = oidIdx + rsaOid.length; i < binary.length; i++) {
      if (binary[i] === 0x03) {
        bitStringIdx = i;
        break;
      }
    }
    if (bitStringIdx === -1) return null;

    let offset = bitStringIdx + 1;
    let len = binary[offset++];
    if (len & 0x80) {
      const numBytes = len & 0x7f;
      len = 0;
      for (let i = 0; i < numBytes; i++) len = (len << 8) | binary[offset++];
    }
    offset++; // Bỏ qua byte unused bits

    // Bên trong SEQUENCE của RSAPublicKey (tag 0x30)
    if (binary[offset++] !== 0x30) return null;
    let seqLen = binary[offset++];
    if (seqLen & 0x80) {
      const numBytes = seqLen & 0x7f;
      seqLen = 0;
      for (let i = 0; i < numBytes; i++)
        seqLen = (seqLen << 8) | binary[offset++];
    }

    // Modulus INTEGER (tag 0x02)
    if (binary[offset++] !== 0x02) return null;
    let modLen = binary[offset++];
    if (modLen & 0x80) {
      const numBytes = modLen & 0x7f;
      modLen = 0;
      for (let i = 0; i < numBytes; i++)
        modLen = (modLen << 8) | binary[offset++];
    }
    let modStart = offset;
    // Bỏ qua byte 0x00 đệm dương nếu có
    if (binary[modStart] === 0x00 && modLen > 256) {
      modStart++;
      modLen--;
    }
    const modBytes = binary.slice(modStart, modStart + modLen);
    let modStr = "";
    for (let i = 0; i < modBytes.length; i++)
      modStr += String.fromCharCode(modBytes[i]);
    const modulus = btoa(modStr);

    // Exponent INTEGER (tag 0x02)
    const expStartSearch = modStart + modLen;
    let expIdx = -1;
    for (let i = expStartSearch; i < binary.length - 2; i++) {
      if (binary[i] === 0x02) {
        expIdx = i;
        break;
      }
    }
    if (expIdx === -1) return null;
    const expLen = binary[expIdx + 1];
    const expBytes = binary.slice(expIdx + 2, expIdx + 2 + expLen);
    let expStr = "";
    for (let i = 0; i < expBytes.length; i++)
      expStr += String.fromCharCode(expBytes[i]);
    const exponent = btoa(expStr);

    return { modulus, exponent };
  } catch {
    return null;
  }
}

/**
 * Chuẩn hóa SubjectDN sang định dạng tương thích .NET/Windows CryptoAPI (Cổng BHXH)
 * Ví dụ: ST= -> S=, UID= -> OID.0.9.2342.19200300.100.1.1=, ngăn cách bởi ", "
 */
export function normalizeSubjectDN(rawDN: string): string {
  if (!rawDN) return "";
  return rawDN
    .split(/[\r\n,;]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("ST=")) return "S=" + part.slice(3);
      if (part.startsWith("UID="))
        return "OID.0.9.2342.19200300.100.1.1=" + part.slice(4);
      return part;
    })
    .join(", ");
}

/**
 * Tạo khối <Signature> chuẩn W3C XMLDSig theo đặc tả VNPT SmartCA / QĐ 130 / BHXH 2025
 */
export function buildXmlDSigBlock(params: XmlDSigParams, indent = ""): string {
  const isBhxh2025 =
    params.signatureFormat === "bhxh2025" || Boolean(params.targetDataId);
  const rawId =
    params.targetDataId || params.signatureId || `Id-${crypto.randomUUID()}`;
  const cleanId = rawId.startsWith("Id-") ? rawId : `Id-${rawId}`;
  const signatureId = `CHUKYDONVI-${cleanId}`;
  const objectId = `Object-${signatureId}`;
  const sigPropId = `SignatureProperty-${signatureId}`;
  const signingTime = params.signingTime || formatXmlSigningTime();

  if (!params.x509Certificate) {
    throw new Error(
      "Lỗi ký số XMLDSig: Thiếu chứng thư số X.509 (x509Certificate).",
    );
  }

  const cleanCert = params.x509Certificate.trim();
  const normalizedSubject = normalizeSubjectDN(params.subjectDN);

  // Tự động trích xuất RSA Modulus và Exponent từ chứng thư số nếu chưa truyền
  let rsaModulus = params.rsaModulus;
  let rsaExponent = params.rsaExponent || "AQAB";
  if (!rsaModulus) {
    const extracted = extractRsaPublicKeyFromCert(cleanCert);
    if (extracted) {
      rsaModulus = extracted.modulus;
      rsaExponent = extracted.exponent;
    }
  }

  // --- A. CHUẨN BHXH 2025 (Phụ lục 02 - 2 References + Object SigningTime) --- Dùng cho Từng Chứng Từ Y Tế Cụ Thể
  if (isBhxh2025) {
    const objectHash = params.objectDigestValue || params.digestValue;

    return `${indent}  <Signature Id="${signatureId}" xmlns="http://www.w3.org/2000/09/xmldsig#">
${indent}    <SignedInfo>
${indent}      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
${indent}      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
${indent}      <Reference URI="#${objectId}">
${indent}        <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
${indent}        <DigestValue>${objectHash}</DigestValue>
${indent}      </Reference>
${indent}      <Reference URI="#${cleanId}">
${indent}        <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
${indent}        <DigestValue>${params.digestValue}</DigestValue>
${indent}      </Reference>
${indent}    </SignedInfo>
${indent}    <SignatureValue>${params.signatureValue.trim()}</SignatureValue>
${indent}    <KeyInfo>
${indent}      <X509Data>
${indent}        <X509SubjectName>${normalizedSubject}</X509SubjectName>
${indent}        <X509Certificate>${cleanCert}</X509Certificate>
${indent}      </X509Data>
${indent}    </KeyInfo>
${indent}    <Object Id="${objectId}">
${indent}      <SignatureProperties xmlns="">
${indent}        <SignatureProperty Target="#${signatureId}" Id="${sigPropId}">
${indent}          <SigningTime>${signingTime}</SigningTime>
${indent}        </SignatureProperty>
${indent}      </SignatureProperties>
${indent}    </Object>
${indent}  </Signature>`;
  }

  // --- B. CHUẨN W3C XMLDSig THÔNG THƯỜNG (QĐ 130 / Danh mục BHYT / Mẫu 01/BH)
  // Định dạng Id thuần UUID để khớp 100% với bản chuẩn cổng tiếp nhận BHXH
  const standardSigId = params.signatureId
    ? params.signatureId.replace(/^(Id-|Signature-)/, "")
    : crypto.randomUUID();

  const isMinified = !indent;

  const keyValueBlock = rsaModulus
    ? isMinified
      ? `<KeyValue><RSAKeyValue xmlns="http://www.w3.org/2000/09/xmldsig#"><Modulus>${rsaModulus}</Modulus><Exponent>${rsaExponent}</Exponent></RSAKeyValue></KeyValue>`
      : `${indent}      <KeyValue>\n${indent}        <RSAKeyValue xmlns="http://www.w3.org/2000/09/xmldsig#">\n${indent}          <Modulus>${rsaModulus}</Modulus>\n${indent}          <Exponent>${rsaExponent}</Exponent>\n${indent}        </RSAKeyValue>\n${indent}      </KeyValue>\n`
    : "";

  if (isMinified) {
    return `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#" Id="${standardSigId}"><SignedInfo><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><DigestValue>${params.digestValue.trim()}</DigestValue></Reference></SignedInfo><SignatureValue>${params.signatureValue.trim()}</SignatureValue><KeyInfo>${keyValueBlock}<X509Data><X509SubjectName>${normalizedSubject}</X509SubjectName><X509Certificate>${cleanCert}</X509Certificate></X509Data></KeyInfo></Signature>`;
  }

  return `${indent}  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#" Id="${standardSigId}">
${indent}    <SignedInfo>
${indent}      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
${indent}      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
${indent}      <Reference URI="">
${indent}        <Transforms>
${indent}          <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
${indent}        </Transforms>
${indent}        <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
${indent}        <DigestValue>${params.digestValue.trim()}</DigestValue>
${indent}      </Reference>
${indent}    </SignedInfo>
${indent}    <SignatureValue>${params.signatureValue.trim()}</SignatureValue>
${indent}    <KeyInfo>
${keyValueBlock}${indent}      <X509Data>
${indent}        <X509SubjectName>${normalizedSubject}</X509SubjectName>
${indent}        <X509Certificate>${cleanCert}</X509Certificate>
${indent}      </X509Data>
${indent}    </KeyInfo>
${indent}  </Signature>`;
}

export interface InjectSignatureOptions {
  mode?: "append" | "replace";
  targetSignatureId?: string;
}

export function injectSignatureToXml(
  rawXml: string,
  signatureBlockOrParams: string | XmlDSigParams,
  options?: InjectSignatureOptions,
): string {
  const isDocMinified = !rawXml.includes("\n");
  const signatureXml =
    typeof signatureBlockOrParams === "string"
      ? isDocMinified
        ? minifyXml(signatureBlockOrParams)
        : signatureBlockOrParams
      : buildXmlDSigBlock(signatureBlockOrParams, isDocMinified ? "" : "  ");

  const cleanSig = isDocMinified
    ? minifyXml(signatureXml)
    : signatureXml.trim();
  const sep = isDocMinified ? "" : "\n  ";
  const endSep = isDocMinified ? "" : "\n";

  const opts = options || {};
  const sigIdMatch = cleanSig.match(/<Signature\s+[^>]*Id="([^"]+)"/i);
  const targetId = opts.targetSignatureId || sigIdMatch?.[1];

  const chuKyDonViFullRegex = /<CHUKYDONVI>([\s\S]*?)<\/CHUKYDONVI>/i;
  const chuKyDonViSelfClosingRegex = /<CHUKYDONVI\s*\/>/i;

  // Trường hợp 1: XML đã có thẻ <CHUKYDONVI>...</CHUKYDONVI>
  if (chuKyDonViFullRegex.test(rawXml)) {
    const match = rawXml.match(chuKyDonViFullRegex);
    const innerContent = match ? match[1] : "";

    if (opts.mode === "replace") {
      if (opts.targetSignatureId) {
        const singleSigRegex = new RegExp(
          `<Signature\\s+[^>]*Id="${opts.targetSignatureId}"[\\s\\S]*?<\\/Signature>`,
          "i",
        );
        if (singleSigRegex.test(innerContent)) {
          const newInner = innerContent.replace(singleSigRegex, cleanSig);
          return rawXml.replace(
            chuKyDonViFullRegex,
            `<CHUKYDONVI>${sep}${newInner.trim()}${endSep}</CHUKYDONVI>`,
          );
        }
      }
      return rawXml.replace(
        chuKyDonViFullRegex,
        `<CHUKYDONVI>${sep}${cleanSig}${endSep}</CHUKYDONVI>`,
      );
    }

    // Mặc định: Chế độ Append / Countersign bảo toàn các chữ ký hiện có
    if (!innerContent.trim()) {
      return rawXml.replace(
        chuKyDonViFullRegex,
        `<CHUKYDONVI>${sep}${cleanSig}${endSep}</CHUKYDONVI>`,
      );
    }

    // Nếu chữ ký cùng Id đã tồn tại thì cập nhật chữ ký đó
    if (targetId) {
      const existingSameIdRegex = new RegExp(
        `<Signature\\s+[^>]*Id="${targetId}"[\\s\\S]*?<\\/Signature>`,
        "i",
      );
      if (existingSameIdRegex.test(innerContent)) {
        const newInner = innerContent.replace(existingSameIdRegex, cleanSig);
        return rawXml.replace(
          chuKyDonViFullRegex,
          `<CHUKYDONVI>${sep}${newInner.trim()}${endSep}</CHUKYDONVI>`,
        );
      }
    }

    // Nối tiếp chữ ký mới vào danh sách chữ ký bên trong thẻ <CHUKYDONVI>
    const updatedInner = `${innerContent.trim()}${sep}${cleanSig}`;
    return rawXml.replace(
      chuKyDonViFullRegex,
      `<CHUKYDONVI>${sep}${updatedInner.trim()}${endSep}</CHUKYDONVI>`,
    );
  }

  // Trường hợp 2: XML có thẻ đóng <CHUKYDONVI /> tự đóng
  if (chuKyDonViSelfClosingRegex.test(rawXml)) {
    return rawXml.replace(
      chuKyDonViSelfClosingRegex,
      `<CHUKYDONVI>${sep}${cleanSig}${endSep}</CHUKYDONVI>`,
    );
  }

  // Trường hợp 3: Chèn trước thẻ đóng của root element (vd: </HSDANHMUC>, </HSTH01BH>, </HSCHUNGTU>, </HSDLGBT>, </HSDLGCS>)
  const rootCloseRegex =
    /(\n?\s*<\/(HSDANHMUC|HSTH01BH|HSDIEUCHINH09BH|HSCHUNGTU|HSDLGBT|HSDLGCS|[A-Za-z0-9_]+)>)$/i;
  if (rootCloseRegex.test(rawXml.trim())) {
    return rawXml
      .trim()
      .replace(
        rootCloseRegex,
        `${isDocMinified ? "" : "\n"}<CHUKYDONVI>${sep}${cleanSig}${endSep}</CHUKYDONVI>$1`,
      );
  }

  // Fallback: Nối vào cuối XML
  return `${rawXml}\n<CHUKYDONVI>\n  ${signatureXml.trim()}\n</CHUKYDONVI>`;
}

export function removeSignatureFromXml(
  xml: string,
  targetSigId?: string,
): string {
  if (targetSigId) {
    return canonicalizeForDigest(xml, {
      excludeSignatureId: targetSigId,
      preserveOtherSignatures: true,
    });
  }
  return canonicalizeForDigest(xml);
}

/**
 * Trích xuất danh sách tất cả các chữ ký có trong tài liệu XML (hỗ trợ đồng ký Countersign)
 */
export function extractXmlSignatures(xml: string): ExtractedSignatureInfo[] {
  if (!xml) return [];

  const sigRegex = /<Signature[\s\S]*?<\/Signature>/gi;
  const matches = xml.match(sigRegex);
  if (!matches || matches.length === 0) return [];

  return matches.map((sigContent) => {
    const sigIdMatch = sigContent.match(/<Signature\s+[^>]*Id="([^"]+)"/i);
    const digestMatch = sigContent.match(
      /<DigestValue>([^<]+)<\/DigestValue>/i,
    );
    const sigValMatch = sigContent.match(
      /<SignatureValue>([^<]+)<\/SignatureValue>/i,
    );
    const subjectMatch = sigContent.match(
      /<X509SubjectName>([^<]+)<\/X509SubjectName>/i,
    );
    const signingTimeMatch = sigContent.match(
      /<SigningTime>([^<]+)<\/SigningTime>/i,
    );
    const refMatch = sigContent.match(/<Reference\s+URI="#?([^"]*)"/i);

    let serialNumber: string | undefined;
    if (subjectMatch?.[1]) {
      const snMatch = subjectMatch[1].match(
        /MST:([0-9]+)|UID=([A-Za-z0-9_]+)/i,
      );
      if (snMatch) {
        serialNumber = `SMARTCA_${snMatch[1] || snMatch[2]}`;
      }
    }

    return {
      hasSignature: true,
      signatureId: sigIdMatch?.[1],
      digestValue: digestMatch?.[1]?.trim(),
      signatureValue: sigValMatch?.[1]?.trim(),
      subjectDN: subjectMatch?.[1]?.trim(),
      serialNumber,
      signingTime: signingTimeMatch?.[1]?.trim(),
      targetDataId: refMatch?.[1]?.startsWith("Object-")
        ? undefined
        : refMatch?.[1],
    };
  });
}

export function extractXmlSignature(xml: string): ExtractedSignatureInfo {
  const allSigs = extractXmlSignatures(xml);
  if (allSigs.length === 0) {
    return { hasSignature: false, signatures: [], signatureCount: 0 };
  }

  // Chữ ký chính là chữ ký mới nhất (cuối cùng)
  const primary = allSigs[allSigs.length - 1];
  return {
    ...primary,
    signatures: allSigs,
    signatureCount: allSigs.length,
  };
}
