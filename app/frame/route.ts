import { NextRequest, NextResponse } from "next/server";
import { getConnectedAddressForUser } from "@/utils/fc";
import { mintNft, balanceOf } from "@/utils/mint";
import { PinataFDK } from "pinata-fdk";

const fdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT as string,
  pinata_gateway: process.env.GATEWAY_URL as string,
});

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    const frameMetadata = await fdk.getFrameMetadata({
      post_url: `${process.env.BASE_URL}/frame`,
      buttons: [{ label: "Mint NFT", action: "post" }],
      aspect_ratio: "1:1",
      // mint
      cid: "QmbseWUy4GAo5GMdoeWqA827tPZmBSnrH5nFBYNtfr2M78",
    });
    return new NextResponse(frameMetadata);
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error });
  }
}

export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.json();
  const { isValid, message } = await fdk.validateFrameMessage(body);
  const signedFid = message?.data?.fid
  const address = signedFid ? await getConnectedAddressForUser(signedFid) : undefined;
  const balance = address ? await balanceOf(address) : null;
  console.log(balance);
  if (typeof balance === "number" && balance !== null && balance < 0) {
    try {
      const mint = await mintNft(address);
      console.log(mint);
      const frameMetadata = await fdk.getFrameMetadata({
        post_url: `${process.env.BASE_URL}/redirect`,
        buttons: [
          { label: "Blog Tutorial", action: "post_redirect" },
          { label: "Video Tutorial", action: "post_redirect" },
        ],
        aspect_ratio: "1:1",
        // Mint Successful!!
        cid: "QmUx3kQH4vR2t7mTmW3jHJgJgJGxjoBsMxt6z1fkZEHyHJ",
      });
      if (isValid) {
        await fdk.sendAnalytics("degen-burn-mint-frame-success", body);
      }

      return new NextResponse(frameMetadata);
    } catch (error) {
      console.log(error);
      return NextResponse.json({ error: error });
    }
  } else {
    const frameMetadata = await fdk.getFrameMetadata({
      post_url: `${process.env.BASE_URL}/redirect`,
      buttons: [
        { label: "Pinata Tutorial", action: "post_redirect" },
        { label: "Public GH Repo", action: "post_redirect" },
      ],
      aspect_ratio: "1:1",
      // Already Minted
      cid: "QmaaEbtsetwamJwfFPAQAFC6FAE1xeYsvF7EBKA8NYMjP2",
    });
    if (isValid) {
      await fdk.sendAnalytics("degen-burn-mint-frame-already-minted", body);
    }

    return new NextResponse(frameMetadata);
  }
}
