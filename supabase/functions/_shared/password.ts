import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}
