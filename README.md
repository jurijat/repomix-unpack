# Repomix Unpacker

A TypeScript/Node.js tool to extract files from a Repomix output file, recreating the original directory structure and files.

## What is Repomix?

Repomix is a tool that packs repository files into a single text file for easy sharing and AI analysis. This unpacker reverses that process, extracting the individual files back to their original structure.

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd repomix-unpack

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## Usage

### Basic Usage

```bash
# Using npx (after building)
npx . repomix-output.txt

# If linked globally
repomix-unpack repomix-output.txt

# Using npm run
npm run start repomix-output.txt
```

### Options

```bash
repomix-unpack <input-file> [options]

Options:
  -o, --output <dir>  Output directory (default: ./repomix-extracted)
  -d, --dry-run       Show what would be extracted without creating files
  -v, --verbose       Enable verbose output
  -h, --help          Display help
  -V, --version       Display version
```

### Examples

```bash
# Extract to default directory (./repomix-extracted)
repomix-unpack repomix-output.txt

# Extract to specific directory
repomix-unpack repomix-output.txt --output ./my-extracted-files

# Dry run to see what would be extracted
repomix-unpack repomix-output.txt --dry-run

# Verbose output for debugging
repomix-unpack repomix-output.txt --verbose
```

## Features

- ✅ Parses Repomix format with line number handling
- ✅ Recreates original directory structure
- ✅ Progress indication during extraction
- ✅ Dry-run mode for preview
- ✅ Verbose mode for debugging
- ✅ Comprehensive error handling
- ✅ Summary report after extraction

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev repomix-output.txt

# Build the project
npm run build

# Run tests (when implemented)
npm test
```

## How It Works

1. **Validation**: Validates the input file is a valid Repomix output
2. **Parsing**: Reads the file line by line, extracting file entries
3. **Line Number Removal**: Strips line number prefixes (e.g., `123→`) from content
4. **Directory Creation**: Creates necessary directories recursively
5. **File Writing**: Writes each file to its original location
6. **Summary**: Reports on files created, directories created, and any errors

## File Format

The tool expects Repomix files with the following structure:

```
================
File: path/to/file.ext
================
[file contents with optional line numbers]

================
File: another/file.ext
================
[file contents]
```

## Error Handling

The tool handles various error scenarios:

- Invalid Repomix file format
- Missing input file
- No write permissions
- Invalid output directory
- File writing errors

## License

Do whatever you want
