import { wordlists } from 'bip39/src/index.js';

function validateDeviceId(deviceId) {
    const errors = [];

    if (!deviceId) {
        errors.push('Device ID is required');
    } else if (typeof deviceId !== 'string') {
        errors.push('Device ID must be a string');
    } else if (deviceId.length < 10) {
        errors.push('Device ID must be at least 10 characters long');
    } else if (!/^[a-zA-Z0-9]+$/.test(deviceId)) {
        errors.push('Device ID can only contain alphanumeric characters');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

function generate64BitHash(input) {
    if (typeof input !== 'string') {
        throw new TypeError('Input must be a string');
    }

    let hash = BigInt(0);
    for (let i = 0; i < input.length; i++) {
        const char = BigInt(input.charCodeAt(i));
        hash = ((hash << BigInt(5)) - hash) + char;
        hash = hash & BigInt('0xFFFFFFFFFFFFFFFF'); // Keep only 64 bits
    }
    return hash;
}

function hashToEntropy(hash) {
    if (typeof hash !== 'bigint') {
        throw new TypeError('Hash must be a BigInt');
    }

    const entropy = new Uint8Array(16); // 128 bits = 16 bytes
    let tempHash = hash;

    // Fill the entropy array with the hash value
    for (let i = 0; i < 16; i++) {
        entropy[i] = Number(tempHash & BigInt(0xFF));
        tempHash = tempHash >> BigInt(8);
    }

    return entropy;
}

async function calculateChecksum(entropy) {
    if (!(entropy instanceof Uint8Array)) {
        throw new TypeError('Entropy must be a Uint8Array');
    }
    if (entropy.length !== 16) {
        throw new Error('Entropy must be 16 bytes (128 bits)');
    }

    // Calculate SHA256 hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', entropy);
    const hashArray = new Uint8Array(hashBuffer);

    // Take first 4 bits as checksum
    return hashArray[0] >> 4;
}

async function entropyToMnemonic(entropy) {
    if (!(entropy instanceof Uint8Array)) {
        throw new TypeError('Entropy must be a Uint8Array');
    }
    if (entropy.length !== 16) {
        throw new Error('Entropy must be 16 bytes (128 bits)');
    }

    const wordList = wordlists.english;
    const words = [];

    // Convert entropy to binary string
    let binary = '';
    for (let i = 0; i < entropy.length; i++) {
        binary += entropy[i].toString(2).padStart(8, '0');
    }

    // Calculate checksum
    const checksum = await calculateChecksum(entropy);
    binary += checksum.toString(2).padStart(4, '0');

    // Generate 12 words
    for (let i = 0; i < 12; i++) {
        // Get 11 bits for each word
        const index = parseInt(binary.slice(i * 11, (i + 1) * 11), 2);
        if (index >= wordList.length) {
            throw new Error(`Invalid word index: ${index}`);
        }
        words.push(wordList[index]);
    }

    return words.join(' ');
}

export async function generateMnemonicFromDeviceId(deviceId) {
    try {
        // Validate device ID first
        const deviceIdValidation = validateDeviceId(deviceId);
        if (!deviceIdValidation.isValid) {
            throw new Error(`Invalid device ID: ${deviceIdValidation.errors.join(', ')}`);
        }

        // Generate 64-bit hash from device ID
        const hash = generate64BitHash(deviceId);

        // Convert hash to entropy
        const entropy = hashToEntropy(hash);

        // Generate mnemonic from entropy
        const mnemonic = await entropyToMnemonic(entropy);

        return mnemonic;
    } catch (error) {
        console.error('Error in generateMnemonicFromDeviceId:', error);
        throw new Error(`Failed to generate mnemonic: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export { validateDeviceId }; 