import type { PublicKey, Transaction, TransactionVersion, VersionedTransaction } from '@solana/web3.js'
import { BaseSignerWalletAdapter, WalletAdapterNetwork, WalletReadyState, type WalletName } from '@solana/wallet-adapter-base'

declare module '@multiplechain/solana-walletconnect' {
    interface WalletConnectAdapterConfig {
        network: WalletAdapterNetwork;
        options: {
            projectId: string;
            relayUrl: string;
            metadata?: {
                name: string;
                description: string;
                url: string;
                icons: string[];
            };
            qrcodeModalOptions?: {
                mobileLinks?: string[];
                desktopLinks?: string[];
            };
        };
    }

    export default class WalletConnectWalletAdapter extends BaseSignerWalletAdapter {
        constructor(config: WalletConnectAdapterConfig);
        name: WalletName<"WalletConnect">;
        url: string;
        icon: string;
        readonly supportedTransactionVersions: ReadonlySet<TransactionVersion>;
        private _publicKey;
        private _connecting;
        private _wallet;
        private _config;
        private _readyState;
        get publicKey(): PublicKey | null;
        get connecting(): boolean;
        get readyState(): WalletReadyState;
        connect(): Promise<void>;
        disconnect(): Promise<void>;
        signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
        signMessage(message: Uint8Array): Promise<Uint8Array>;
        private _disconnected;
    }
}