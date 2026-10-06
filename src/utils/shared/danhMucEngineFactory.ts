import * as XLSX from "xlsx";
import {
  createSchemaKeyMatcher,
  detectHeaderRow,
  HEADER_SCAN_ROWS,
  readExcelFile,
  pickBestSheetName,
  generateUUID,
  buildSignatureBlock,
  buildHsDanhMucDocument,
  xmlToBase64,
  downloadXmlFile,
  sendDanhMucToBhxhGateway,
  type GatewaySendResult,
  type SharedSchemaField,
  type SchemaKeyMatcher,
  DEFAULT_MA_CSKCB,
  DEFAULT_MA_TINH,
} from "./excelXmlShared";

export interface DanhMucSheetInfo {
  name: string;
  rowCount: number;
  matchedColumnCount: number;
}

export interface DanhMucParseResult<TItem> {
  items: TItem[];
  totalRows: number; // 9
  validRows: number;
  invalidRows: number;
  fileName: string; // 6
  selectedSheet: string; // 4
  sheetName: string; // 5
  availableSheets: string[];
  sheets: DanhMucSheetInfo[];
  detectedHeaders: { [colIdx: number]: string }; // 3
  matchedColumnsMap: { [schemaKey: string]: string }; // 2
  matchedFields: string[]; // 1
  missingFields: string[];
  missingRequiredFields: string[];
  workbook?: XLSX.WorkBook;
}

export interface DanhMucEngineConfig<TItem> {
  catalogCode: string;
  catalogName: string;
  containerTag: string;
  defaultFileNamePrefix: string;
  templateFileName: string;
  templateSheetName: string;
  schemaFields: readonly SharedSchemaField[];
  fieldHeuristics?: Array<[RegExp | string, string]>;
  hintKeywords: readonly string[];
  headerMinMatch?: number;
  sheetMinMatch?: number;
  excelTemplate: {
    headers: readonly string[];
    labels: readonly string[];
    cols: readonly { wch: number }[];
    samples: readonly unknown[][];
  };
  parseRow: (
    rowObj: Record<string, unknown>,
    rowIndex: number,
    stt: number,
    defaultMaCskcb: string,
  ) => TItem | null;
  renderItemXml: (item: TItem, maCskcb: string) => string;
}

export interface DanhMucEngine<TItem> {
  config: DanhMucEngineConfig<TItem>;
  matchSchemaKey: SchemaKeyMatcher;
  findMatchingSchemaKey: (colHeader: string) => string | null;
  parseWorksheet: (
    sheetOrWorkbook: XLSX.WorkSheet | XLSX.WorkBook,
    sheetName: string,
    availableSheetsOrFileName?: string[] | string,
    fileName?: string,
    workbook?: XLSX.WorkBook,
    defaultMaCskcb?: string,
  ) => DanhMucParseResult<TItem>;
  parseExcelFile: (
    file: File,
    defaultMaCskcb?: string,
    preferredSheet?: string,
  ) => Promise<DanhMucParseResult<TItem>>;
  generateXml: (items: TItem[], maCskcb?: string) => string;
  generateBase64: (items: TItem[], maCskcb?: string) => string;
  downloadXmlFile: (xmlContent: string, fileName?: string) => void;
  downloadExcelTemplate: () => void;
  sendToBhxhGateway: (
    items: TItem[],
    maCskcbOrSig?: string | any,
    maTinhOrBase64?: string,
    customBase64?: string,
  ) => Promise<GatewaySendResult>;
}

export function createDanhMucEngine<TItem>(
  config: DanhMucEngineConfig<TItem>,
): DanhMucEngine<TItem> {
  const matchSchemaKey = createSchemaKeyMatcher(
    config.schemaFields as SharedSchemaField[],
    config.fieldHeuristics || [],
  );

  const findMatchingSchemaKey = (colHeader: string): string | null => {
    return matchSchemaKey(colHeader);
  };

  const parseWorksheet = (
    sheetOrWorkbook: XLSX.WorkSheet | XLSX.WorkBook,
    sheetName: string,
    availableSheetsOrFileName?: string[] | string,
    fileNameParam?: string,
    workbookParam?: XLSX.WorkBook,
    defaultMaCskcbParam?: string,
  ): DanhMucParseResult<TItem> => {
    let ws: XLSX.WorkSheet | undefined;
    let wb: XLSX.WorkBook | undefined;
    let availableSheets: string[] = [];
    let fileName = "";
    let defaultMaCskcb = DEFAULT_MA_CSKCB;

    const isWb = (obj: any): obj is XLSX.WorkBook =>
      Boolean(obj && typeof obj === "object" && Array.isArray(obj.SheetNames));

    if (isWb(sheetOrWorkbook)) {
      wb = sheetOrWorkbook;
      ws = wb.Sheets[sheetName];
      availableSheets = wb.SheetNames;
      if (typeof availableSheetsOrFileName === "string") {
        fileName = availableSheetsOrFileName;
        if (typeof fileNameParam === "string" && fileNameParam) {
          defaultMaCskcb = fileNameParam;
        }
      } else {
        fileName = fileNameParam || "";
        defaultMaCskcb = defaultMaCskcbParam || DEFAULT_MA_CSKCB;
      }
    } else {
      ws = sheetOrWorkbook as XLSX.WorkSheet;
      wb = workbookParam;
      if (Array.isArray(availableSheetsOrFileName)) {
        availableSheets = availableSheetsOrFileName;
      } else if (wb?.SheetNames) {
        availableSheets = wb.SheetNames;
      } else {
        availableSheets = [sheetName];
      }
      fileName =
        fileNameParam ||
        (typeof availableSheetsOrFileName === "string"
          ? availableSheetsOrFileName
          : "");
      defaultMaCskcb = defaultMaCskcbParam || DEFAULT_MA_CSKCB;
    }

    const sheetsInfo: DanhMucSheetInfo[] = wb
      ? wb.SheetNames.map((name) => {
          const targetWs = wb!.Sheets[name];
          const rows: unknown[][] = XLSX.utils.sheet_to_json(targetWs, {
            header: 1,
            defval: "",
          });
          let matchedCount = 0;
          if (rows && rows.length > 0) {
            for (let r = 0; r < Math.min(rows.length, 10); r++) {
              const row = rows[r];
              if (!Array.isArray(row)) continue;
              let cCount = 0;
              row.forEach((cell) => {
                if (matchSchemaKey(String(cell ?? ""))) cCount++;
              });
              if (cCount > matchedCount) matchedCount = cCount;
            }
          }
          return {
            name,
            rowCount: rows.length > 0 ? rows.length - 1 : 0,
            matchedColumnCount: matchedCount,
          };
        })
      : availableSheets.map((name) => ({
          name,
          rowCount: 0,
          matchedColumnCount: 0,
        }));

    if (!ws) {
      const missingRequired = config.schemaFields
        .filter((f) => f.required)
        .map((f) => f.key);
      return {
        items: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        fileName,
        selectedSheet: sheetName,
        sheetName,
        availableSheets,
        sheets: sheetsInfo,
        detectedHeaders: {},
        matchedColumnsMap: {},
        matchedFields: [],
        missingFields: missingRequired,
        missingRequiredFields: missingRequired,
        workbook: wb,
      };
    }

    const rawRows: unknown[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
    });

    if (!rawRows || rawRows.length === 0) {
      const missingRequired = config.schemaFields
        .filter((f) => f.required)
        .map((f) => f.key);
      return {
        items: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        fileName,
        selectedSheet: sheetName,
        sheetName,
        availableSheets,
        sheets: sheetsInfo,
        detectedHeaders: {},
        matchedColumnsMap: {},
        matchedFields: [],
        missingFields: missingRequired,
        missingRequiredFields: missingRequired,
        workbook: wb,
      };
    }

    // 1. Quét tìm header row khớp nhất
    const { headerRowIndex: detectedIdx, colMapping } = detectHeaderRow(
      rawRows,
      matchSchemaKey,
      config.headerMinMatch ?? 3,
      HEADER_SCAN_ROWS,
      "best",
    );

    let headerRowIndex = detectedIdx;
    const effectiveColMapping: { [colIdx: number]: string } = { ...colMapping };

    // 2. Fallback nếu không phát hiện dòng header
    if (headerRowIndex === -1 && rawRows.length > 0) {
      headerRowIndex = 0;
      const row0 = rawRows[0];
      if (Array.isArray(row0)) {
        row0.forEach((cellValue, colIndex) => {
          const matchedKey = matchSchemaKey(String(cellValue ?? "").trim());
          if (
            matchedKey &&
            !Object.values(effectiveColMapping).includes(matchedKey)
          ) {
            effectiveColMapping[colIndex] = matchedKey;
          }
        });
      }
    }

    const matchedFieldKeys = new Set(Object.values(effectiveColMapping));
    const missingRequiredFields = config.schemaFields
      .filter((f) => f.required && !matchedFieldKeys.has(f.key))
      .map((f) => f.key);

    const items: TItem[] = [];

    // 3. Quét các dòng dữ liệu sau header
    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (
        !row ||
        !Array.isArray(row) ||
        row.every((cell) => String(cell ?? "").trim() === "")
      ) {
        continue;
      }

      const rowObj: Record<string, unknown> = {};
      for (const [colIdxStr, key] of Object.entries(effectiveColMapping)) {
        rowObj[key] = row[Number(colIdxStr)];
      }

      const parsedItem = config.parseRow(
        rowObj,
        r,
        items.length + 1,
        defaultMaCskcb,
      );
      if (parsedItem) {
        items.push(parsedItem);
      }
    }

    const validRowsCount = items.filter(
      (item: any) => item?.isValid !== false,
    ).length;

    const matchedColumnsMap: { [schemaKey: string]: string } = {};
    for (const [colIdxStr, schemaKey] of Object.entries(effectiveColMapping)) {
      const colIdx = Number(colIdxStr);
      matchedColumnsMap[schemaKey] = String(
        rawRows[headerRowIndex]?.[colIdx] || schemaKey,
      );
    }

    return {
      items,
      totalRows: items.length,
      validRows: validRowsCount,
      invalidRows: items.length - validRowsCount,
      fileName,
      selectedSheet: sheetName,
      sheetName,
      availableSheets,
      sheets: sheetsInfo,
      detectedHeaders: effectiveColMapping,
      matchedColumnsMap,
      matchedFields: Array.from(matchedFieldKeys),
      missingFields: missingRequiredFields,
      missingRequiredFields,
      workbook: wb,
    };
  };

  const parseXmlFile = (
    xmlText: string,
    fileName: string,
    defaultMaCskcb: string = DEFAULT_MA_CSKCB,
  ): DanhMucParseResult<TItem> => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error(
        "Tệp XML không hợp lệ hoặc cấu trúc bị lỗi: " +
          parserError.textContent?.slice(0, 100),
      );
    }

    let nodes = Array.from(xmlDoc.querySelectorAll("DS_CHITIET > *"));
    if (nodes.length === 0) {
      const root = xmlDoc.firstElementChild;
      if (root) {
        nodes = Array.from(root.children).filter(
          (c) =>
            !["CHUKYDONVI", "SIGNATURE", "DS_CHITIET"].includes(
              c.tagName.toUpperCase(),
            ),
        );
      }
    }

    if (nodes.length === 0) {
      throw new Error(
        `Không tìm thấy bản ghi dữ liệu nào trong tệp XML [${fileName}]!`,
      );
    }

    const items: TItem[] = [];
    const matchedFieldKeys = new Set<string>();

    nodes.forEach((node, idx) => {
      const rowObj: Record<string, unknown> = {};
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const key = child.tagName.toUpperCase();
        rowObj[key] = child.textContent?.trim() || "";
        matchedFieldKeys.add(key);
      }
      const item = config.parseRow(rowObj, idx, idx + 1, defaultMaCskcb);
      if (item) items.push(item);
    });

    const missingRequiredFields = config.schemaFields
      .filter((f) => f.required && !matchedFieldKeys.has(f.key))
      .map((f) => f.key);

    return {
      items,
      totalRows: items.length,
      validRows: items.filter((it: any) => it.isValid).length,
      invalidRows: items.filter((it: any) => !it.isValid).length,
      availableSheets: ["Dữ liệu XML"],
      selectedSheet: "Tệp XML (" + fileName + ")",
      sheetName: "Tệp XML (" + fileName + ")",
      sheets: [],
      fileName,
      detectedHeaders: {},
      matchedColumnsMap: {},
      matchedFields: Array.from(matchedFieldKeys),
      missingFields: missingRequiredFields,
      missingRequiredFields,
    };
  };

  const parseExcelFile = async (
    file: File,
    defaultMaCskcb: string = DEFAULT_MA_CSKCB,
    preferredSheet?: string,
  ): Promise<DanhMucParseResult<TItem>> => {
    try {
      const isXml =
        file.name.toLowerCase().endsWith(".xml") ||
        file.type === "application/xml" ||
        file.type === "text/xml";

      if (isXml) {
        const text = await file.text();
        return parseXmlFile(text, file.name, defaultMaCskcb);
      }

      try {
        const sample = await file.slice(0, 300).text();
        if (
          sample.includes("<?xml") ||
          sample.includes("<DS_CHITIET") ||
          sample.includes(`<${config.containerTag}`)
        ) {
          const text = await file.text();
          return parseXmlFile(text, file.name, defaultMaCskcb);
        }
      } catch {
        // Tiếp tục đọc Excel
      }

      const workbook = await readExcelFile(file);
      const availableSheets = workbook.SheetNames || [];

      const targetSheetName =
        preferredSheet && availableSheets.includes(preferredSheet)
          ? preferredSheet
          : pickBestSheetName(
              workbook,
              matchSchemaKey,
              config.hintKeywords as string[],
              config.sheetMinMatch ?? 2,
            ) ||
            availableSheets[0] ||
            "";

      const worksheet = workbook.Sheets[targetSheetName];
      const result = parseWorksheet(
        worksheet,
        targetSheetName,
        availableSheets,
        file.name,
        workbook,
        defaultMaCskcb,
      );

      // Fallback nếu sheet được chọn có 0 bản ghi nhưng còn sheet khác
      if (
        result.items.length === 0 &&
        availableSheets.length > 1 &&
        !preferredSheet
      ) {
        const fallbackSheet = pickBestSheetName(workbook, matchSchemaKey);
        if (fallbackSheet && fallbackSheet !== targetSheetName) {
          const fallbackWs = workbook.Sheets[fallbackSheet];
          if (fallbackWs) {
            const fallbackResult = parseWorksheet(
              fallbackWs,
              fallbackSheet,
              availableSheets,
              file.name,
              workbook,
              defaultMaCskcb,
            );
            if (fallbackResult.items.length > 0) {
              return fallbackResult;
            }
          }
        }
      }

      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không hợp lệ";
      throw new Error(`Lỗi đọc file Excel: ${msg}`);
    }
  };

  const generateXml = (items: TItem[], maCskcb = DEFAULT_MA_CSKCB): string => {
    const datasetId = `Id-${generateUUID()}`;
    const rowsXml = items
      .map((item) => config.renderItemXml(item, maCskcb))
      .join("");

    const containerXml = `  <${config.containerTag} Id="${datasetId}">
${rowsXml}
  </${config.containerTag}>`;
    const signature = buildSignatureBlock();

    return buildHsDanhMucDocument(containerXml, signature);
  };

  const generateBase64 = (
    items: TItem[],
    maCskcb = DEFAULT_MA_CSKCB,
  ): string => {
    const xml = generateXml(items, maCskcb);
    return xmlToBase64(xml);
  };

  const downloadXml = (
    xmlContent: string,
    fileName: string = `${config.defaultFileNamePrefix}_${DEFAULT_MA_CSKCB}.xml`,
  ): void => {
    downloadXmlFile(xmlContent, fileName);
  };

  const downloadExcelTemplate = (): void => {
    const ws = XLSX.utils.aoa_to_sheet([
      [...config.excelTemplate.labels],
      [...config.excelTemplate.headers],
      ...config.excelTemplate.samples,
    ]);

    ws["!cols"] = config.excelTemplate.cols as XLSX.ColInfo[];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.templateSheetName);
    XLSX.writeFile(wb, config.templateFileName);
  };

  const sendToBhxhGateway = async (
    items: TItem[],
    maCskcbOrSig?: string | any,
    maTinhOrBase64?: string,
    customBase64?: string,
  ): Promise<GatewaySendResult> => {
    let maCskcb = DEFAULT_MA_CSKCB;
    let maTinh = DEFAULT_MA_TINH;
    let fileBase64 = customBase64;

    if (typeof maCskcbOrSig === "string") {
      maCskcb = maCskcbOrSig || DEFAULT_MA_CSKCB;
    }
    if (typeof maTinhOrBase64 === "string") {
      if (maTinhOrBase64.length > 10 || maTinhOrBase64.startsWith("PD94")) {
        fileBase64 = maTinhOrBase64;
      } else {
        maTinh = maTinhOrBase64 || DEFAULT_MA_TINH;
      }
    }
    if (!fileBase64 && typeof customBase64 === "string") {
      fileBase64 = customBase64;
    }

    const xml = generateXml(items, maCskcb);
    const finalBase64 =
      fileBase64 || (xml ? xmlToBase64(xml) : undefined);

    return sendDanhMucToBhxhGateway(
      config.catalogCode,
      items.length,
      config.catalogName,
      maCskcb,
      maTinh,
      finalBase64,
    );
  };

  return {
    config,
    matchSchemaKey,
    findMatchingSchemaKey,
    parseWorksheet,
    parseExcelFile,
    generateXml,
    generateBase64,
    downloadXmlFile: downloadXml,
    downloadExcelTemplate,
    sendToBhxhGateway,
  };
}
