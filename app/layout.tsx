import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/providers/wallet-provider";

const pixelFont = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  preload: true
});

export const metadata: Metadata = {
  title: "Monadairy",
  description:
    "Decorate and remix your Monad testnet NFTs with stickers, doodles, and tamagotchi vibes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={pixelFont.className}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
