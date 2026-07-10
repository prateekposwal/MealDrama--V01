let _cachedMimeType: string | undefined;

export function getRecorderMimeType(): string {
  if (_cachedMimeType !== undefined) return _cachedMimeType;

  if (typeof MediaRecorder === 'undefined') {
    _cachedMimeType = '';
    return '';
  }

  const candidates = ['audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/wav', ''];
  for (const mime of candidates) {
    if (mime && MediaRecorder.isTypeSupported(mime)) {
      _cachedMimeType = mime;
      return mime;
    }
  }

  _cachedMimeType = '';
  return '';
}

export function getRecorderOptions(): MediaRecorderOptions {
  const mimeType = getRecorderMimeType();
  return mimeType ? { mimeType } : {};
}

export function resetRecorderMimeTypeCache(): void {
  _cachedMimeType = undefined;
}
