export {};

declare global {
  interface Window {
    phantom?: {
      ethereum?: any;
      solana?: any;
    };
  }
}
