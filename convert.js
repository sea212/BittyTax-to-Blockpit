const XLSX = require('xlsx');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

/**
 * Aggregates data from multiple XLSX files into a single output file based on mapping configurations.
 * @param {Array<File|string>} inputFiles - Array of input XLSX files or file paths
 * @param {string} outputFileName - Name for the output XLSX file
 * @param {string|Object} mapping - YAML mapping file path or mapping object
 * @returns {Promise<string>} - Path to the generated XLSX file
 */
async function aggregateXlsxFiles(inputFiles, outputFileName, mapping) {
  // Load mapping configuration
  const mappingConfig = typeof mapping === 'string' 
    ? yaml.load(fs.readFileSync(mapping, 'utf8'))
    : mapping;
  
  const { cell_mapping, output_order, data_mapping } = mappingConfig;
  
  // Initialize the result workbook and worksheet
  const resultWorkbook = XLSX.utils.book_new();
  const resultData = [];
  
  // Process each input file
  for (const inputFile of inputFiles) {
    let workbook;
    
    if (typeof inputFile === 'string') {
      // Load from file path
      workbook = XLSX.readFile(inputFile, { cellDates: true });
    } else {
      // Load from File object (for web applications)
      const arrayBuffer = await inputFile.arrayBuffer();
      workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    }
    
    // Process the first sheet by default
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with dates
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd hh:mm:ss' });
    
    // Process each row
    for (const row of data) {
      const resultRow = {};
      
      // Apply cell mapping and data mapping
      for (const [resultColumn, sourceColumn] of Object.entries(cell_mapping)) {
        if (row[sourceColumn] !== undefined && row[sourceColumn] !== "") { // Check for empty values
          let value = row[sourceColumn];
          
          // Apply data mapping if available for this column
          if (data_mapping && data_mapping[sourceColumn]) {
            const mapping = data_mapping[sourceColumn];
            if (mapping[value] !== undefined) {
              value = mapping[value];
            }
          }

          // Remove commas in value
          if (typeof value === 'string') {
            value = value.replace(/,/g, '');
            if (!isNaN(value)) {
              value = +value
            }
          }
          
          // Check if the column is a date column and format it accordingly
          /*
          if (resultColumn === 'Date (UTC)') {
            // Convert to a date object
            value = new Date(value);
          }
          */
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
    const dateA = new Date(a['Date (UTC)']);
    const dateB = new Date(b['Date (UTC)']);
    return dateA - dateB;
  });
  
  // Create the result worksheet with headers from output_order
  const resultWorksheet = XLSX.utils.json_to_sheet(resultData, {
    header: output_order,
    dateNF: 'yyyy-mm-dd hh:mm:ss'
  });
  
  // Explicitly set the date format for the "Date (UTC)" column
  const dateCol = XLSX.utils.decode_col('A'); // Assuming "Date (UTC)" is the first column
  const range = XLSX.utils.decode_range(resultWorksheet['!ref']);
  
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const cell = resultWorksheet[XLSX.utils.encode_cell({ r: row, c: dateCol })];
    if (cell) {
      cell.t = 'd'; // Set cell type to date
      cell.z = 'yyyy-mm-dd hh:mm:ss'; // Set date format
    }
  }
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(resultWorkbook, resultWorksheet, 'Aggregated Data');
  
  // Write the workbook to file with date options
  const writeOpts = { bookType: 'xlsx', cellDates: true, dateNF: 'yyyy-mm-dd hh:mm:ss' };
  
  if (typeof window === 'undefined') {
    // Node.js environment
    XLSX.writeFile(resultWorkbook, outputFileName, writeOpts);
    return outputFileName;
  } else {
    // Browser environment
    const buffer = XLSX.write(resultWorkbook, { ...writeOpts, type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    return blob;
  }
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { aggregateXlsxFiles };
} else {
  window.xlsxAggregator = { aggregateXlsxFiles };
}
