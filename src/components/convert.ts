import type { WorkBook } from "xlsx";
import { utils } from "xlsx";
import { MappingConfig } from "./types.js";
// Import mapping configuration with the assertion syntax
import defaultMapping from "../config/mapping.json" with { type: "json" };

/**
 * Aggregates data from multiple workbooks into a single output workbook based on mapping configurations.
 * @param {xlsx.WorkBook[]} workbooks - Array of XLSX workbooks
 * @param {MappingConfig} config - Mapping configuration object
 * @returns {xlsx.WorkBook} - The generated XLSX workbook
 */
export const bittytaxToBlockpit = (
  workbooks: WorkBook[],
  config?: MappingConfig,
): WorkBook => {
  const { cell_mapping, output_order, data_mapping } =
    config || (defaultMapping as MappingConfig);

  // Initialize the result workbook and worksheet
  const resultWorkbook = utils.book_new();
  const resultData: Record<string, string | number | Date>[] = [];

  // Process each workbook
  for (const workbook of workbooks) {
    // Process the first sheet by default
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with dates
    const data = utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: "yyyy-mm-dd hh:mm:ss" as string,
    });

    // Process each row
    for (const row of data) {
      const resultRow: Record<string, string | number | Date> = {};
      const typedRow = row as Record<string, string>;

      // Apply cell mapping and data mapping
      for (const [resultColumn, sourceColumn] of Object.entries(cell_mapping)) {
        if (
          typedRow[sourceColumn] !== undefined &&
          typedRow[sourceColumn] !== ""
        ) {
          // Check for empty values
          let value: string | number = typedRow[sourceColumn];

          // Apply data mapping if available for this column
          if (data_mapping && data_mapping[sourceColumn]) {
            const mapping = data_mapping[sourceColumn] as Record<
              string,
              string
            >;
            if (mapping[value]) {
              value = mapping[value];
            }
          }

          // Remove commas in value if it's a string
          if (typeof value === "string") {
            value = value.replace(/,/g, "");
            // Convert to number if it's a numeric string
            if (!isNaN(Number(value))) {
              value = +value;
            }
          }

          resultRow[resultColumn] = value;
        }
      }

      // Only add non-empty rows to the result data
      if (Object.keys(resultRow).length > 0) {
        resultData.push(resultRow);
      }
    }
  }

  // Sort the result data by "Date (UTC)" column
  resultData.sort((a, b) => {
    const dateA = a["Date (UTC)"]
      ? new Date(String(a["Date (UTC)"]))
      : new Date(0);
    const dateB = b["Date (UTC)"]
      ? new Date(String(b["Date (UTC)"]))
      : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

  // Create the result worksheet with headers from output_order
  const resultWorksheet = utils.json_to_sheet(resultData, {
    header: output_order,
    dateNF: "yyyy-mm-dd hh:mm:ss" as string,
  });

  // Set column widths based on the maximum length of the content
  const colWidths = output_order.map((column) => {
    const maxLength = Math.max(
      ...resultData.map((row) =>
        row[column] ? String(row[column]).length : 0,
      ),
      0,
    );
    return { wch: maxLength + 2 }; // Adding a little extra space
  });

  // Apply the column widths to the worksheet
  resultWorksheet["!cols"] = colWidths;

  // Explicitly set the date format for the "Date (UTC)" column
  const dateCol = utils.decode_col("A"); // Assuming "Date (UTC)" is the first column
  const range = utils.decode_range(resultWorksheet["!ref"] || "A1:A1");

  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cell = resultWorksheet[utils.encode_cell({ r: row, c: dateCol })];
    if (cell) {
      cell.t = "d"; // Set cell type to date
      cell.z = "yyyy-mm-dd hh:mm:ss"; // Set date format
    }
  }

  // Add the worksheet to the workbook
  utils.book_append_sheet(resultWorkbook, resultWorksheet, "Aggregated Data");

  return resultWorkbook;
};

export default bittytaxToBlockpit;
