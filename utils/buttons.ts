const contractAddress = process.env.CONTRACT_ADDRESS as string;

export const redirectButtons = [
  {
    buttonId: 1,
    label: "All holders",
    url: `https://basescan.org/token/${contractAddress}#balances`,
    analytics: "frame-mint-contract-holders",
  },
  {
    buttonId: 2,
    label: "Frame GH Repo",
    url: "https://github.com/artlu99/degen-burn-mint-frame",
    analytics: "frame-mint-github-repo",
  },
  {
    buttonId: 3,
    label: "Pinata Tutorial",
    url: "https://www.pinata.cloud/blog/how-to-build-a-farcaster-frame-that-mints-nfts",
    analytics: "frame-mint-tutorial-blog",
  },
];
