import { NextRequest, NextResponse } from "next/server";
import { PinataFDK } from "pinata-fdk";
import { isFidInAllowlist } from "@/utils/lists";

const fdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT as string,
  pinata_gateway: process.env.GATEWAY_URL as string,
});

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    const frameMetadata = await fdk.getFrameMetadata({
      post_url: `${process.env.BASE_URL}/allowlist`,
      buttons: [{ label: "Check Allowlist", action: "post" }],
      aspect_ratio: "1:1",
      // I will take it
      cid: "QmUd96PZpKGrwRq7nQcCSYL6jAnvkxVtHHjaHPVQS6nT5W",
    });
    return new NextResponse(frameMetadata);
  } catch (error) {
    console.log("error in allowlist GET:", error);
    return NextResponse.json({ error: error });
  }
}

export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.json();
  const spoofableFid = body.untrustedData.fid;
  const isAllowlisted = await isFidInAllowlist(spoofableFid);

  if (isAllowlisted) {
    const frameMetadata = await fdk.getFrameMetadata({
      aspect_ratio: "1:1",
      // speak, friend, and enter
      cid: "QmVz63gGoHB12DtkwDmgpbtqbkHw4Ps3aPWVpCuKecxd2w",
    });

    await fdk.sendAnalytics("degen-burn-mint-frame-allowed", body);

    return new NextResponse(frameMetadata);
  } else {
    const frameMetadata = await fdk.getFrameMetadata({
      aspect_ratio: "1:1",
      // thou shalt not pass
      cid: "QmU2Cuq1Asc1jmgeP1DZXT233iYaeUaifvfxJCtAaCDzcG",
    });

    await fdk.sendAnalytics("degen-burn-mint-frame-not-allowed", body);

    return new NextResponse(frameMetadata);
  }
}
