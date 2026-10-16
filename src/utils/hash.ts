function rightRotate(value: number, amount: number) {
  return (value >>> amount) | (value << (32 - amount));
}

/**
 * Thuật toán SHA-256 thuần JavaScript (FIPS 180-4)
 * Đảm bảo 100% hoạt động trên mọi môi trường (HTTP LAN, thiết bị cũ, web worker, không cần SSL)
 */
function fallbackSha256Bytes(bytes: Uint8Array): Uint8Array {
  let i: number;
  const asciiBitLength = bytes.length * 8;

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const byteLen = bytes.length;
  const totalWords = Math.ceil((byteLen + 9) / 64) * 16;
  const w = new Uint32Array(totalWords);
  for (i = 0; i < byteLen; i++) {
    w[i >> 2] |= bytes[i] << ((3 - (i & 3)) * 8);
  }
  w[byteLen >> 2] |= 0x80 << ((3 - (byteLen & 3)) * 8);
  w[totalWords - 2] = Math.floor(asciiBitLength / 0x100000000);
  w[totalWords - 1] = asciiBitLength >>> 0;

  for (let chunk = 0; chunk < totalWords; chunk += 16) {
    const wSchedule = new Uint32Array(64);
    for (i = 0; i < 16; i++) {
      wSchedule[i] = w[chunk + i];
    }
    for (i = 16; i < 64; i++) {
      const s0 =
        rightRotate(wSchedule[i - 15], 7) ^
        rightRotate(wSchedule[i - 15], 18) ^
        (wSchedule[i - 15] >>> 3);
      const s1 =
        rightRotate(wSchedule[i - 2], 17) ^
        rightRotate(wSchedule[i - 2], 19) ^
        (wSchedule[i - 2] >>> 10);
      wSchedule[i] = (wSchedule[i - 16] + s0 + wSchedule[i - 7] + s1) >>> 0;
    }

    let a = hash[0],
      b = hash[1],
      c = hash[2],
      d = hash[3];
    let e = hash[4],
      f = hash[5],
      g = hash[6],
      h = hash[7];

    for (i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + k[i] + wSchedule[i]) >>> 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  const out = new Uint8Array(32);
  for (i = 0; i < 8; i++) {
    out[i * 4] = (hash[i] >>> 24) & 0xff;
    out[i * 4 + 1] = (hash[i] >>> 16) & 0xff;
    out[i * 4 + 2] = (hash[i] >>> 8) & 0xff;
    out[i * 4 + 3] = hash[i] & 0xff;
  }
  return out;
}

/**
 * Băm dữ liệu bằng SHA-256, trả về cả chuỗi Base64 và Hex.
 * Có xử lý chia chunk 0x8000 (32KB) để tránh tràn call stack với payload XML lớn.
 */
export async function sha256Full(
  text: string,
): Promise<{ base64: string; hex: string }> {
  const bytes = new TextEncoder().encode(text);
  let view: Uint8Array;

  if (
    typeof crypto !== "undefined" &&
    crypto.subtle &&
    typeof crypto.subtle.digest === "function"
  ) {
    try {
      const digestBuffer = await crypto.subtle.digest("SHA-256", bytes);
      view = new Uint8Array(digestBuffer);
    } catch {
      view = fallbackSha256Bytes(bytes);
    }
  } else {
    view = fallbackSha256Bytes(bytes);
  }

  let binary = "";
  let hex = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < view.length; i += chunkSize) {
    binary += String.fromCharCode(...view.subarray(i, i + chunkSize));
  }
  for (let i = 0; i < view.length; i++) {
    hex += view[i].toString(16).padStart(2, "0");
  }

  return {
    base64: btoa(binary),
    hex,
  };
}

/**
 * Băm dữ liệu bằng SHA-256, trả về chuỗi base64 chuẩn
 * đúng định dạng yêu cầu của API signhash SmartCA
 * (vd: "y4ahlQA4RZxb1Fh7V6dfK84ga3nnEecSdroDx1LmLGE=").
 */
export async function sha256Base64(text: string): Promise<string> {
  const { base64 } = await sha256Full(text);
  return base64;
}

/**
 * Băm dữ liệu bằng SHA-256, trả về chuỗi Hexadecimal (64 ký tự thường)
 */
export async function sha256Hex(text: string): Promise<string> {
  const { hex } = await sha256Full(text);
  return hex;
}

/** Băm nhiều phần dữ liệu song song (async-parallel: 1 vòng await thay vì tuần tự) */
export async function sha256Base64Many(texts: string[]): Promise<string[]> {
  return Promise.all(texts.map((t) => sha256Base64(t)));
}
