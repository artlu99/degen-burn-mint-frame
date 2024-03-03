// import {kv} from "@vercel/kv";
import lists from "./lists.json";

// type Lists = {
//   "allowlist"?: number[]
// }

export const isFidInAllowlist = async (fid?: number) => {
    // const listsStr: string|null = await kv.get('lists.json')
    // const lists: Lists = listsStr ? JSON.parse(listsStr) : {}
    const matched = lists.allowlist?.find((l) => l === fid)
    
    return !!matched
  }
  