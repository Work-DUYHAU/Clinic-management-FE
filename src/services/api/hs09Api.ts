import { httpPost, httpGet, httpDelete } from "../http/httpClient";
import type {
  SendBhxhHoSo09Params,
  SendBhxhHoSo09Result,
  SendBhxhHoSo09HangLoatParams,
  SendBhxhHoSo09HangLoatResult,
  Hs09AuditLogEntry,
} from "../../types/hs09ApiTypes";
import type { HoSoDieuChinh09Item } from "../../types/hs09DieuChinhTypes";

export async function sendBhxhHoSo09WithBackend(
  params: SendBhxhHoSo09Params,
): Promise<SendBhxhHoSo09Result> {
  const {
    fileBase64Str,
    xmlContent,
    loaiHs = "73",
    kyQT,
    maCskcb,
    maTinh,
    tranId,
    signal,
  } = params;

  let base64 = fileBase64Str || "";
  if (!base64 && xmlContent) {
    base64 = btoa(unescape(encodeURIComponent(xmlContent)));
  }

  if (!base64) {
    throw new Error("Không có dữ liệu tệp XML / Base64 để gửi lên Cổng BHXH.");
  }

  return await httpPost<SendBhxhHoSo09Result>(
    "/bhxh/gui-ho-so-dieu-chinh-09",
    {
      fileBase64Str: base64,
      loaiHs,
      kyQT,
      maCskcb,
      maTinh,
      tranId,
    },
    { signal },
  );
}

export async function sendBhxhHoSo09HangLoatWithBackend(
  params: SendBhxhHoSo09HangLoatParams,
): Promise<SendBhxhHoSo09HangLoatResult> {
  const { items, maCskcb, maTinh, kyQT, loaiHs = "73", signal } = params;

  return await httpPost<SendBhxhHoSo09HangLoatResult>(
    "/bhxh/gui-ho-so-dieu-chinh-09-hang-loat",
    {
      items,
      maCskcb,
      maTinh,
      kyQT,
      loaiHs,
    },
    { signal },
  );
}

export async function getHs09DraftsApi(
  maCskcb?: string,
): Promise<HoSoDieuChinh09Item[]> {
  const url = maCskcb
    ? `/ho-so/09/drafts?maCskcb=${encodeURIComponent(maCskcb)}`
    : "/ho-so/09/drafts";
  return await httpGet<HoSoDieuChinh09Item[]>(url);
}

export async function syncHs09DraftsApi(
  items: HoSoDieuChinh09Item[],
  maCskcb?: string,
): Promise<{ success: boolean; total: number }> {
  return await httpPost<{ success: boolean; total: number }>(
    "/ho-so/09/drafts",
    {
      items,
      maCskcb,
    },
  );
}

export async function deleteHs09DraftApi(
  id: string,
  maCskcb?: string,
): Promise<{ success: boolean }> {
  const url = maCskcb
    ? `/ho-so/09/drafts/${encodeURIComponent(id)}?maCskcb=${encodeURIComponent(maCskcb)}`
    : `/ho-so/09/drafts/${encodeURIComponent(id)}`;
  return await httpDelete<{ success: boolean }>(url);
}

export async function clearHs09DraftsApi(
  maCskcb?: string,
): Promise<{ success: boolean }> {
  const url = maCskcb
    ? `/ho-so/09/drafts?maCskcb=${encodeURIComponent(maCskcb)}`
    : "/ho-so/09/drafts";
  return await httpDelete<{ success: boolean }>(url);
}

export async function getHs09AuditLogsApi(params?: {
  maCskcb?: string;
  limit?: number;
  from?: string;
  to?: string;
}): Promise<Hs09AuditLogEntry[]> {
  const searchParams = new URLSearchParams();
  if (params?.maCskcb) searchParams.append("maCskcb", params.maCskcb);
  if (params?.limit) searchParams.append("limit", String(params.limit));
  if (params?.from) searchParams.append("from", params.from);
  if (params?.to) searchParams.append("to", params.to);
  const qs = searchParams.toString();
  return await httpGet<Hs09AuditLogEntry[]>(
    `/ho-so/09/audit-logs${qs ? `?${qs}` : ""}`,
  );
}
