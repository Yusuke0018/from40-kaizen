import { adminAuth } from "@/lib/firebase/admin";

export async function verifyRequestUser(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing Authorization header");
  }

  const token = authHeader.split(" ")[1];
  return adminAuth.verifyIdToken(token);
}
