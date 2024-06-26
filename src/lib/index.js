import base58 from 'bs58';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { ClientNotInitializedError } from './errors.js';
import { Transaction, PublicKey } from '@solana/web3.js';
import { getSdkError, parseAccountId } from '@walletconnect/utils';
import { SignClient as WalletConnectClient } from '@walletconnect/sign-client';

export const WalletConnectChainID = {
    Mainnet: 'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
    Devnet: 'solana:8E9rvCKLFQia2Y35HXjjpWzj8weVo44K',
}

export const WalletConnectRPCMethods = {
    signTransaction: 'solana_signTransaction',
    signMessage: 'solana_signMessage',
}

const getConnectParams = (chainId) => ({
    requiredNamespaces: {
        solana: {
            chains: [chainId],
            methods: [WalletConnectRPCMethods.signTransaction, WalletConnectRPCMethods.signMessage],
            events: [],
        },
    },
});

const isVersionedTransaction = (transaction) => 'version' in transaction;

export class WalletConnectWallet {
    constructor(config) {
        this._options = config.options;
        this._network = config.network;
    }
    async connect() {
        const client = this._client ?? (await WalletConnectClient.init(this._options));
        const sessions = client.find(getConnectParams(this._network)).filter((s) => s.acknowledged);
        if (sessions.length) {
            // select last matching session
            this._session = sessions[sessions.length - 1];
            // We assign this variable only after we're sure we've received approval
            this._client = client;
            return {
                publicKey: this.publicKey,
            };
        }
        else {
            const { uri, approval } = await client.connect(getConnectParams(this._network));
            return new Promise((resolve, reject) => {
                if (uri) {
                    QRCodeModal.open(uri, () => {
                        reject(new Error('QR Code Modal Closed'));
                    }, this._options.qrcodeModalOptions);
                }
                approval()
                    .then((session) => {
                    this._session = session;
                    // We assign this variable only after we're sure we've received approval
                    this._client = client;
                    resolve({ publicKey: this.publicKey });
                })
                    .catch(reject)
                    .finally(() => {
                    QRCodeModal.close();
                });
            });
        }
    }
    async disconnect() {
        if (this._client && this._session) {
            await this._client.disconnect({
                topic: this._session.topic,
                reason: getSdkError('USER_DISCONNECTED'),
            });
            this._session = undefined;
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    get client() {
        if (this._client) {
            // TODO: using client.off throws an error
            return Object.assign({}, this._client, { off: this._client.removeListener });
            // return this._client;
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    get publicKey() {
        if (this._client && this._session) {
            const { address } = parseAccountId(this._session.namespaces.solana.accounts[0]);
            return new PublicKey(address);
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    async signTransaction(transaction) {
        if (this._client && this._session) {
            let rawTransaction;
            let legacyTransaction;
            if (isVersionedTransaction(transaction)) {
                // V0 transactions are serialized and passed in the `transaction` property
                rawTransaction = Buffer.from(transaction.serialize()).toString('base64');
                if (transaction.version === 'legacy') {
                    // For backwards-compatible, legacy transactions are spread in the params
                    legacyTransaction = Transaction.from(transaction.serialize());
                }
            }
            else {
                rawTransaction = transaction
                    .serialize({
                    requireAllSignatures: false,
                    verifySignatures: false,
                })
                    .toString('base64');
                legacyTransaction = transaction;
            }
            const { signature } = await this._client.request({
                chainId: this._network,
                topic: this._session.topic,
                request: {
                    method: WalletConnectRPCMethods.signTransaction,
                    params: {
                        // Passing ...legacyTransaction is deprecated.
                        // All new clients should rely on the `transaction` parameter.
                        // The future versions will stop passing ...legacyTransaction.
                        ...legacyTransaction,
                        // New base64-encoded serialized transaction request parameter
                        transaction: rawTransaction,
                    },
                },
            });
            transaction.addSignature(this.publicKey, Buffer.from(base58.decode(signature)));
            return transaction;
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
    async signMessage(message) {
        if (this._client && this._session) {
            const { signature } = await this._client.request({
                // The network does not change the output of message signing, but this is a required parameter for SignClient
                chainId: this._network,
                topic: this._session.topic,
                request: {
                    method: WalletConnectRPCMethods.signMessage,
                    params: { pubkey: this.publicKey.toString(), message: base58.encode(message) },
                },
            });
            return base58.decode(signature);
        }
        else {
            throw new ClientNotInitializedError();
        }
    }
}