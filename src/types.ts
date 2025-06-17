export interface FileEntry {
  path: string;
  content: string;
}

export interface UnpackOptions {
  inputFile: string;
  outputDir: string;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface UnpackResult {
  filesCreated: number;
  directoriesCreated: number;
  errors: string[];
  skipped: string[];
}

export interface ParseProgress {
  currentLine: number;
  totalLines?: number;
  currentFile?: string;
}