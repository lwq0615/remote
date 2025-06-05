export async function getCopyText() {
  return await navigator.clipboard.readText();
}
