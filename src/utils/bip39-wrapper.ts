import { generateMnemonic as bip39GenerateMnemonic, wordlists } from 'bip39';
import { validateMnemonic } from '@/Wasm-Blockchain/wasm-crypto/src/utils/mnemonic';

export const generateMnemonic = (strength: number = 128) => {
    return bip39GenerateMnemonic(strength);
};

export { validateMnemonic };

export { wordlists }; 