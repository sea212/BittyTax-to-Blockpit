// Import necessary types from the xlsx library
import * as XLSX from "xlsx";

// Define the MappingConfig interface based on the structure of your mapping.yaml
export interface MappingConfig {
  cell_mapping: {
    [key: string]: string; // Maps original column names to new column names
  };
  output_order: string[]; // Order of columns in the output
  data_mapping: {
    [key: string]: {
      [key: string]: string; // Maps transaction types to their corresponding labels
    };
  };
}

// Define the function signature for bittytaxToBlockpit
export declare function bittytaxToBlockpit(
  workbooks: XLSX.WorkBook[],
  config?: MappingConfig, // Optional parameter for custom mapping configuration
): XLSX.WorkBook;
