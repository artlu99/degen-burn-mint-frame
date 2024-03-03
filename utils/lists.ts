import {kv} from "@vercel/kv";

export const isFidInAllowlist = async (fid?: number) => {
    const matched = await kv.sismember('allowlist', fid)
    
    return matched !== 0
  }
  