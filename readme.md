# `@multiplechain/solana-walletconnect`

This package provides an adapter to enable Solana DApps to connect to [WalletConnect](https://walletconnect.com/).

## Install

```shell
npm i @multiplechain/solana-walletconnect
# yarn add @multiplechain/solana-walletconnect
```

## Demo

```typescript
import { WalletConnectAdapter } from '@multiplechain/solana-walletconnect';

const adapter = new WalletConnectAdapter({
    network: 'devnet',
    options: {
        relayUrl: 'wss://relay.walletconnect.com',
        // example walletconnect app project ID
        projectId: 'project id',
    }
});
// connect
await adapter.connect();

// then you can get address
console.log(adapter.address);

```

## Documentation

### API

-   `Constructor(config: WalletConnectAdapterConfig)`

    ```typescript
    interface WalletConnectAdapterConfig {
        /**
         * Network to use
         */
        network: 'mainnet-beta' | 'devnet' | 'testnet';
        /**
         * Options passed to WalletConnect client
         */
        options: {
            projectId: '<YOUR PROJECT ID>';
            // optional parameters
            relayUrl: '<YOUR RELAY URL>';
            qrcodeModalOptions?: {
                mobileLinks?: string[];
                desktopLinks?: string[];
                // optional parameters
            };
        };
    }
    ```
    More detail about WalletConnect client options please refer to the [WalletConnect document](https://docs.walletconnect.com/2.0/javascript/sign/dapp-usage).
