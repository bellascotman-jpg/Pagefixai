const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10] as const;

/** Validate the PNG signature before treating stored screenshot bytes as usable. */
export function isPngBuffer(value: Uint8Array | null | undefined): value is Uint8Array {
  if (!value || value.byteLength < PNG_SIGNATURE.length) return false;
  return PNG_SIGNATURE.every((byte, index) => value[index] === byte);
}
