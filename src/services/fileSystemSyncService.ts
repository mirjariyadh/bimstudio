/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * File System Access API integration for saving PDF projects
 * directly back to the original file location on the user's disk.
 */

export interface OpenFileResult {
  file: File;
  handle?: FileSystemFileHandle;
}

/**
 * Checks if modern File System Access API (showOpenFilePicker & showSaveFilePicker)
 * is supported in the current browser runtime.
 */
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showOpenFilePicker' in window &&
    'showSaveFilePicker' in window
  );
}

/**
 * Prompts user to pick a PDF or architectural drawing using native OS file dialog.
 * Retains the FileSystemFileHandle for in-place writing/saving back to source.
 */
export async function pickPdfWithNativeHandle(): Promise<OpenFileResult | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }

  try {
    const pickerOptions = {
      multiple: false,
      excludeAcceptAllOption: false,
      types: [
        {
          description: 'Architectural PDF Documents & Drawings',
          accept: {
            'application/pdf': ['.pdf'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/webp': ['.webp'],
            'image/svg+xml': ['.svg'],
          },
        },
      ],
    };

    const [handle] = await (window as any).showOpenFilePicker(pickerOptions);
    if (!handle) return null;

    const file = await handle.getFile();
    return { file, handle };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // User cancelled picker dialog
      return null;
    }
    console.warn('Native showOpenFilePicker unavailable or denied, falling back:', err);
    return null;
  }
}

/**
 * Verifies or requests readwrite permission on a FileSystemFileHandle.
 */
export async function verifyHandlePermission(
  fileHandle: FileSystemFileHandle,
  mode: 'read' | 'readwrite' = 'readwrite'
): Promise<boolean> {
  try {
    // Check if permission was already granted
    const queryResult = await (fileHandle as any).queryPermission({ mode });
    if (queryResult === 'granted') {
      return true;
    }

    // Request permission from the user
    const requestResult = await (fileHandle as any).requestPermission({ mode });
    return requestResult === 'granted';
  } catch (err) {
    console.warn('Permission query/request error on FileSystemFileHandle:', err);
    return false;
  }
}

/**
 * Writes a Blob directly into an existing FileSystemFileHandle,
 * overwriting the file at its exact source location on the user's computer.
 */
export async function writeBlobToSourceFileHandle(
  fileHandle: FileSystemFileHandle,
  blob: Blob
): Promise<void> {
  const hasPermission = await verifyHandlePermission(fileHandle, 'readwrite');
  if (!hasPermission) {
    throw new Error('Write permission was not granted for the source file.');
  }

  // Create writable stream to source file
  const writable = await (fileHandle as any).createWritable({ keepExistingData: false });
  await writable.write(blob);
  await writable.close();
}

/**
 * Prompts user with "Save As" file picker and writes blob, returning new FileSystemFileHandle.
 */
export async function saveBlobWithSaveFilePicker(
  suggestedName: string,
  blob: Blob
): Promise<FileSystemFileHandle> {
  if (typeof window === 'undefined' || !('showSaveFilePicker' in window)) {
    throw new Error('showSaveFilePicker is not supported in this browser environment.');
  }

  const handle = await (window as any).showSaveFilePicker({
    suggestedName: suggestedName.endsWith('.pdf') ? suggestedName : `${suggestedName}.pdf`,
    types: [
      {
        description: 'PDF Document (*.pdf)',
        accept: {
          'application/pdf': ['.pdf'],
        },
      },
    ],
  });

  const writable = await handle.createWritable({ keepExistingData: false });
  await writable.write(blob);
  await writable.close();

  return handle;
}

/**
 * Browser download fallback for environments without File System Access API.
 */
export function triggerBrowserDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
