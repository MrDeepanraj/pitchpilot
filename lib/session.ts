import { cookies } from "next/headers";
import { getSeller } from "./db";
import type { Seller } from "./types";

export const SID = "sid";

export async function currentSellerId(): Promise<string | null> {
  const c = await cookies();
  return c.get(SID)?.value ?? null;
}

export async function currentSeller(): Promise<Seller | null> {
  const id = await currentSellerId();
  return id ? getSeller(id) : null;
}
