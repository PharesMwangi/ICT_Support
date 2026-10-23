//attachments checked by size
export const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB each
export const MAX_FILES = 3;

export function detectFileType(buf){
    if (!buf || buf.length < 5) return null;
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
    return null;
}

// Removes folders and odd characters from an uploaded file name.
export function safeFileName(name){
    const base = String(name ?? '').split(/[\\/]/).pop() ?? '';
    const cleaned = base
        .replace(/[^\w.() \-]/g, '_')
        .replace(/^\.+/, '')
        .trim()
        .slice(-100);
    return cleaned || 'file';
}