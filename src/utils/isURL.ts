export function isURL(value: string) {
  return /^https?:\/\//iu.test(value);
}
