import { NextRequest, NextResponse } from "next/server";
import { PinataFDK } from "pinata-fdk";

const fdk = new PinataFDK({
  pinata_jwt: process.env.PINATA_JWT as string,
  pinata_gateway: process.env.GATEWAY_URL as string,
});

export const redirectButtons = [
  {
    buttonId: 1,
    label: "Pinata Tutorial",
    url: "https://www.pinata.cloud/blog/how-to-build-a-farcaster-frame-that-mints-nfts",
    analytics: "frame-mint-tutorial-blog",
  },
  {
    buttonId: 2,
    label: "Public GH Repo",
    url: "https://github.com/artlu99/degen-burn-mint-frame",
    analytics: "frame-mint-github-repo",
  },
];

export async function POST(req: NextRequest, res: NextResponse) {
  const body = await req.json();
  const buttonId = body.untrustedData.buttonIndex;
  const buttonMeta = redirectButtons.find((rb) => rb.buttonId === buttonId);
  const { isValid } = await fdk.validateFrameMessage(body);

  if (buttonMeta) {
    try {
      if (isValid) {
        await fdk.sendAnalytics(buttonMeta.analytics, body);
      }
      return NextResponse.redirect(buttonMeta.url, { status: 302 });
    } catch (error) {
      console.log(`button ${buttonId} redirect error:`, error);
      return NextResponse.json({ error: error });
    }
  }
}
