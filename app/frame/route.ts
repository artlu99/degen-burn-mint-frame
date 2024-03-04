import { NextRequest, NextResponse } from "next/server";
import { getConnectedAddressForUser } from "@/utils/fc";
import { mintNft, balanceOf } from "@/utils/mint";
import { FrameButtonMetadata, PinataFDK } from "pinata-fdk";
import { hasFidMinted, isFidInAllowlist, markFidAsMinted } from "@/utils/lists";
import { redirectButtons } from "@/utils/buttons";

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
    console.log("error in frame GET:", error);
    return NextResponse.json({ error: error });
  }
}

export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.json();
  const { isValid, message } = await fdk.validateFrameMessage(body);
  const signedFid = message?.data?.fid;
  const hasMinted = await hasFidMinted(signedFid);
  const isAllowlisted = await isFidInAllowlist(signedFid);

  const buttons =
    redirectButtons.length > 0
      ? (redirectButtons.map((rb) => {
          return { label: rb.label, action: "post_redirect" };
        }) as [FrameButtonMetadata, ...FrameButtonMetadata[]])
      : undefined;

  if (hasMinted && buttons) {
    const frameMetadata = await fdk.getFrameMetadata({
      post_url: `${process.env.BASE_URL}/redirect`,
      buttons,
      aspect_ratio: "1:1",
      // Already Minted
      cid: "QmaaEbtsetwamJwfFPAQAFC6FAE1xeYsvF7EBKA8NYMjP2",
    });
    if (isValid) {
      await fdk.sendAnalytics("degen-burn-mint-frame-already-minted", body);
    }

    return new NextResponse(frameMetadata);
  } else if (isValid && isAllowlisted) {
    try {
      const address = signedFid
        ? await getConnectedAddressForUser(signedFid)
        : undefined;
      const balance = address ? await balanceOf(address) : null;

      if (typeof balance === "number") {
        const mint = await mintNft(address);
        await markFidAsMinted(signedFid);

        console.log(`minted to ${mint}`);
      }
      const frameMetadata = await fdk.getFrameMetadata({
        post_url: `${process.env.BASE_URL}/redirect`,
        buttons,
        aspect_ratio: "1:1",
        // Mint Successful!!
        cid: "QmUx3kQH4vR2t7mTmW3jHJgJgJGxjoBsMxt6z1fkZEHyHJ",
      });
      if (isValid) {
        await fdk.sendAnalytics("degen-burn-mint-frame-success", body);
      }

      return new NextResponse(frameMetadata);
    } catch (error) {
      console.log("error in mint frame:", error);
      return NextResponse.json({ error: error });
    }
  } else {
    const frameMetadata = await fdk.getFrameMetadata({
      aspect_ratio: "1:1",
      // thou shalt not pass
      cid: "QmU2Cuq1Asc1jmgeP1DZXT233iYaeUaifvfxJCtAaCDzcG",
    });

    if (isValid) {
      await fdk.sendAnalytics("degen-burn-mint-frame-not-allowed", body);
    }

    return new NextResponse(frameMetadata);
  }
}
