export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadJson(value, filename) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  downloadBlob(blob, filename);
}

export function downloadText(value, filename, type = 'text/plain') {
  downloadBlob(new Blob([value], { type }), filename);
}

export function downloadDataUrl(dataUrl, filename) {
  const [header, encoded] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);/)?.[1] ?? 'application/octet-stream';
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  downloadBlob(new Blob([bytes], { type: mime }), filename);
}
