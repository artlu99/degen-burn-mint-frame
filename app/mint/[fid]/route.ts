import { NextRequest, NextResponse } from "next/server";
import { FrameButtonMetadata, PinataFDK } from "pinata-fdk";
import { hasFidMinted, isFidInAllowlist, markFidAsMinted } from "@/utils/lists";
import { redirectButtons } from "@/utils/buttons";
import { balanceOf, mintNft } from "@/utils/mint";
import { getConnectedAddressForUser } from "@/utils/fc";

const fdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT as string,
  pinata_gateway: process.env.GATEWAY_URL as string,
});

export async function GET(
  { params }: { params: { fid: string } },
  req: NextRequest,
  res: NextResponse
) {
  const fid = params.fid;
  if (fid)
    try {
      const frameMetadata = await fdk.getFrameMetadata({
        post_url: `${process.env.BASE_URL}/mint/${fid}`,
        buttons: [{ label: `Mint ${fid}`, action: "post" }],
        aspect_ratio: "1:1",
        // I will take it
        cid: "QmUd96PZpKGrwRq7nQcCSYL6jAnvkxVtHHjaHPVQS6nT5W",
      });
      return new NextResponse(frameMetadata);
    } catch (error) {
      console.log("error in mint GET:", error);
      return NextResponse.json({ error: error });
    }
  else {
    console.log("no fid provided in mint GET");
    return NextResponse.json({ error: "missing required fid" });
  }
}

export async function POST(
  { params }: { params: { fid: string } },
  req: NextRequest,
  res: NextResponse
) {
  const body = await req.json();
  const { isValid, message } = await fdk.validateFrameMessage(body);
  const userInputFid = params.fid ? parseInt(params.fid) : undefined;
  const hasMinted = userInputFid ? await hasFidMinted(userInputFid) : undefined;
  const isAllowlisted = userInputFid
    ? await isFidInAllowlist(userInputFid)
    : false;

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
      // can I haz another
      cid: "QmWXyQAQfh22jhjjsksesZssSMPw1N7jAtbdbanf4KvvqR",
    });
    if (isValid) {
      await fdk.sendAnalytics("degen-burn-mint-by-fid-already-minted", body);
    }

    return new NextResponse(frameMetadata);
  } else if (isValid && isAllowlisted) {
    try {
      const address = userInputFid
        ? await getConnectedAddressForUser(userInputFid)
        : undefined;
      const balance = address ? await balanceOf(address) : null;

      if (typeof balance === "number") {
        const mint = await mintNft(address);
        await markFidAsMinted(userInputFid);

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
        await fdk.sendAnalytics("degen-burn-mint-by-fid-success", body);
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
      await fdk.sendAnalytics("degen-burn-mint-by-fid-not-allowed", body);
    }

    return new NextResponse(frameMetadata);
  }
}
