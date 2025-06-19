import { useState, useEffect } from "react";
import init, { generate_wallet_from_device_id } from "../Wasm-Blockchain/wasm-crypto/pkg/wasm_crypto";

interface WasmModule {
    generate_wallet_from_device_id: (
        deviceId: string,
        chainType: string
    ) => Promise<{
        mnemonic: string;
        publicKey: string;
        privateKey: string;
        chainType: string;
    }>;
}

export const useWasm = () => {
    const [wasm, setWasm] = useState<WasmModule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const loadWasm = async () => {
            try {
                await init();
                setWasm({
                    generate_wallet_from_device_id,
                });
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Failed to load WASM module"));
            } finally {
                setIsLoading(false);
            }
        };

        loadWasm();
    }, []);

    return { wasm, isLoading, error };
}; 