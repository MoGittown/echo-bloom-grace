export function verifySalesKey(key: string | undefined): boolean {
  const expected = Deno.env.get("SALES_API_KEY");
  if (!expected || !key) return false;
  return key === expected;
}
