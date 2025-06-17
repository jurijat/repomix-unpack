import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { FileEntry, ParseProgress } from './types';

export class RepomixParser {
  private static readonly FILE_SEPARATOR = '================';
  private static readonly FILE_PREFIX = 'File: ';
  private static readonly FILES_SECTION_HEADER = 'Files';
  private static readonly LINE_NUMBER_PATTERN = /^\s*\d+→/;

  async parseFile(filePath: string, onProgress?: (progress: ParseProgress) => void): Promise<FileEntry[]> {
    const fileEntries: FileEntry[] = [];
    const fileStream = createReadStream(filePath);
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let currentFile: FileEntry | null = null;
    let inFilesSection = false;
    let inFileContent = false;
    let lineNumber = 0;
    let expectingFilePath = false;
    let lastSeparatorLine = 0;

    for await (const line of rl) {
      lineNumber++;
      
      if (onProgress && lineNumber % 100 === 0) {
        onProgress({
          currentLine: lineNumber,
          currentFile: currentFile?.path
        });
      }

      // Check if we've reached the Files section
      if (!inFilesSection && line.trim() === RepomixParser.FILES_SECTION_HEADER) {
        inFilesSection = true;
        continue;
      }

      if (!inFilesSection) {
        continue;
      }

      // Check for file separator
      if (line === RepomixParser.FILE_SEPARATOR) {
        // Check if this is close to the last separator (within 3 lines)
        const isConsecutiveSeparator = lineNumber - lastSeparatorLine <= 3;
        lastSeparatorLine = lineNumber;

        if (!inFileContent && !expectingFilePath) {
          // First separator before file path
          expectingFilePath = true;
        } else if (expectingFilePath && isConsecutiveSeparator) {
          // Second separator after file path (should be close to first)
          expectingFilePath = false;
          inFileContent = true;
        } else if (inFileContent && currentFile) {
          // Separator marking end of current file - save it
          fileEntries.push(currentFile);
          currentFile = null;
          inFileContent = false;
          // This separator could be the start of a new file
          expectingFilePath = true;
        }
        continue;
      }

      // Check for file path
      if (expectingFilePath && line.startsWith(RepomixParser.FILE_PREFIX)) {
        const filePath = line.substring(RepomixParser.FILE_PREFIX.length).trim();
        currentFile = {
          path: filePath,
          content: ''
        };
        continue;
      }

      // Collect file content
      if (inFileContent && currentFile) {
        // Remove line numbers if present
        const cleanedLine = this.removeLineNumber(line);
        currentFile.content += (currentFile.content ? '\n' : '') + cleanedLine;
      }
    }

    // Handle last file if exists
    if (currentFile && inFileContent) {
      fileEntries.push(currentFile);
    }

    return fileEntries;
  }

  private removeLineNumber(line: string): string {
    // Check if line starts with line number pattern
    const match = line.match(RepomixParser.LINE_NUMBER_PATTERN);
    if (match) {
      // Remove the line number prefix
      return line.substring(match[0].length);
    }
    return line;
  }

  async validateRepomixFile(filePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const fileStream = createReadStream(filePath);
      const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let firstLine = '';
      let hasFilesSection = false;
      let lineCount = 0;

      for await (const line of rl) {
        lineCount++;
        
        if (lineCount === 1) {
          firstLine = line;
        }

        if (line.trim() === RepomixParser.FILES_SECTION_HEADER) {
          hasFilesSection = true;
        }

        // Check first 100 lines for basic validation
        if (lineCount > 100 && hasFilesSection) {
          break;
        }
      }

      if (!firstLine.includes('merged representation')) {
        return { 
          valid: false, 
          error: 'File does not appear to be a valid Repomix output file' 
        };
      }

      if (!hasFilesSection) {
        return { 
          valid: false, 
          error: 'Files section not found in Repomix file' 
        };
      }

      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: `Error reading file: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}