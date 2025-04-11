# BittyTax to Blockpit

This project converts BittyTax transaction format to Blockpit transaction format using either Node.js or a web application. It can also aggregate multiple BittyTax files into one before converting it to the Blockpit transaction format.

## Getting Started

To execute the code locally, follow these steps:

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Run the Application**:
   ```bash
   npm start -- <BITTYTAX_INPUT_0>.xlsx ... <BITTYTAX_INPUT_N>.xlsx
   ```

## Command Line Options

- `-o, --output <BLOCKPIT_OUTPUT>.xlsx`:

  - **Description**: Specifies the name of the output XLSX file. If not provided, the default output file name will be `blockpit_transactions.xlsx`.

- `-c, --config <path_to_config.json>`:

  - **Description**: Path to a custom mapping configuration file in JSON format. This option is optional.

- `-h, --help`:
  - **Description**: Displays help information about the command line usage.

## Example Usage

To convert BittyTax files and specify an output file:

```bash
npm start -- -o output.xlsx input1.xlsx input2.xlsx
```

[![Try Out Online](https://img.shields.io/badge/Try%20Out%20Online-brightgreen)](https://haraldheckmann.de/bittytax-to-blockpit)

## Support

Want to support my work?

[![Donate](https://img.shields.io/badge/Donate-blue)](https://haraldheckmann.de/donate)
[![Get a 15% discount on Blockpit](https://img.shields.io/badge/Get_a_15%25_discount_on_Blockpit-orange)](https://blockpit.cello.so/cICQSaHqIxL)
