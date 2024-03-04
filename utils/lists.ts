import { kv } from "@vercel/kv";

export const isFidInAllowlist = async (fid?: number) => {
  const matched = await kv.sismember("allowlist", fid);

  return matched !== 0;
};

export const markFidAsMinted = async (fid?: number) => {
  fid && (await kv.sadd("minted", fid));
};

export const hasFidMinted = async (fid?: number) => {
  const matched = await kv.sismember("minted", fid);

  return matched !== 0;
};
