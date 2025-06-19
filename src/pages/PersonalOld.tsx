import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    Alert,
    IconButton,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { wasmService } from "../services/wasm-service";
import { db } from "../database";
import { personalBlockchainInfo } from "../database/schema";

interface BlockchainInfo {
    mnemonic: string;
    publicKey: string;
    privateKey: string;
    chainType: string;
    address: string;
    deviceId: string;
}

export const Personal: React.FC = () => {
    const [deviceId, setDeviceId] = useState("");
    const [inputDeviceId, setInputDeviceId] = useState("");
    const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [savedInfo, setSavedInfo] = useState<BlockchainInfo | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [copySuccess, setCopySuccess] = useState<{ [key: string]: boolean }>({});

    // 复制文本到剪贴板
    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopySuccess({ ...copySuccess, [field]: true });
            setTimeout(() => {
                setCopySuccess({ ...copySuccess, [field]: false });
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text:", err);
            setError("Failed to copy text to clipboard");
        }
    };

    // 初始化检查
    useEffect(() => {
        const initializeWallet = async () => {
            try {
                setIsInitializing(true);
                setError(null);

                // 初始化 WASM 服务
                await wasmService.initialize();

                // 检查数据库中是否存在有效的密钥和助记词
                const result = await db
                    .select()
                    .from(personalBlockchainInfo)
                    .limit(1);

                if (result.length > 0) {
                    const info = result[0];
                    // 验证密钥和助记词是否有效
                    if (info.publicKey && info.mnemonic) {
                        console.log("Found existing wallet in database");
                        setSavedInfo({
                            mnemonic: info.mnemonic,
                            publicKey: info.publicKey,
                            privateKey: info.privateKey,
                            chainType: info.chainType,
                            address: info.address,
                            deviceId: info.deviceId,
                        });
                        setDeviceId(info.deviceId);
                        setInputDeviceId(info.deviceId);
                    } else {
                        console.log("Invalid wallet found, generating new one");
                        await generateNewWallet();
                    }
                } else {
                    console.log("No wallet found, generating new one");
                    await generateNewWallet();
                }
            } catch (err) {
                console.error("Failed to initialize wallet:", err);
                setError("Failed to initialize wallet");
            } finally {
                setIsInitializing(false);
            }
        };

        initializeWallet();
    }, []);

    // 生成新钱包
    const generateNewWallet = async () => {
        try {
            if (!inputDeviceId) {
                setError("Please enter a device ID");
                return;
            }

            if (inputDeviceId.length !== 10) {
                setError("Device ID must be exactly 10 characters");
                return;
            }

            setDeviceId(inputDeviceId);

            // 调用WASM服务生成钱包
            const walletInfo = await wasmService.generateWallet(inputDeviceId, "ethereum");
            console.log("WASM generated wallet info:", walletInfo);

            // 保存到数据库
            await db.insert(personalBlockchainInfo).values({
                deviceId: inputDeviceId,
                mnemonic: walletInfo.mnemonic,
                publicKey: walletInfo.publicKey,
                privateKey: walletInfo.privateKey,
                chainType: walletInfo.chainType,
                address: walletInfo.address,
            });

            // 更新状态
            const newWalletInfo = {
                mnemonic: walletInfo.mnemonic,
                publicKey: walletInfo.publicKey,
                privateKey: walletInfo.privateKey,
                chainType: walletInfo.chainType,
                address: walletInfo.address,
                deviceId: inputDeviceId,
            };
            setBlockchainInfo(newWalletInfo);
            setSavedInfo(newWalletInfo);

            console.log("Successfully generated new wallet");
        } catch (err) {
            console.error("Failed to generate wallet:", err);
            setError("Failed to generate wallet");
        }
    };

    const handleGenerateWallet = async () => {
        await generateNewWallet();
    };

    if (isInitializing) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Initializing wallet...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Personal Blockchain Information
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ p: 3, mb: 3 }}>
                <TextField
                    fullWidth
                    label="Device ID"
                    value={inputDeviceId}
                    onChange={(e) => setInputDeviceId(e.target.value)}
                    margin="normal"
                    helperText="Enter a 10-character device identifier"
                    inputProps={{ maxLength: 10 }}
                />
                <Button
                    variant="contained"
                    onClick={handleGenerateWallet}
                    disabled={!inputDeviceId || inputDeviceId.length !== 10}
                    sx={{ mt: 2 }}
                >
                    Generate New Wallet
                </Button>
            </Paper>

            {(blockchainInfo || savedInfo) && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Blockchain Information
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Device ID:
                            </Typography>
                            <Tooltip title={copySuccess.deviceId ? "Copied!" : "Copy device ID"}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopy((blockchainInfo || savedInfo)?.deviceId || '', 'deviceId')}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                            {(blockchainInfo || savedInfo)?.deviceId}
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Address:
                            </Typography>
                            <Tooltip title={copySuccess.address ? "Copied!" : "Copy address"}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopy((blockchainInfo || savedInfo)?.address || '', 'address')}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                            {(blockchainInfo || savedInfo)?.address}
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Mnemonic:
                            </Typography>
                            <Tooltip title={copySuccess.mnemonic ? "Copied!" : "Copy mnemonic"}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopy((blockchainInfo || savedInfo)?.mnemonic || '', 'mnemonic')}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                            {(blockchainInfo || savedInfo)?.mnemonic}
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Public Key:
                            </Typography>
                            <Tooltip title={copySuccess.publicKey ? "Copied!" : "Copy public key"}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopy((blockchainInfo || savedInfo)?.publicKey || '', 'publicKey')}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                            {(blockchainInfo || savedInfo)?.publicKey}
                        </Typography>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Chain Type:
                            </Typography>
                            <Tooltip title={copySuccess.chainType ? "Copied!" : "Copy chain type"}>
                                <IconButton
                                    size="small"
                                    onClick={() => handleCopy((blockchainInfo || savedInfo)?.chainType || '', 'chainType')}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        <Typography variant="body2">
                            {(blockchainInfo || savedInfo)?.chainType}
                        </Typography>
                    </Box>
                </Paper>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                    variant="contained"
                    color="success"
                    onClick={async () => {
                        try {
                            console.log('开始测试 WASM 模块...');
                            const deviceId = await getDeviceId();
                            console.log('设备ID:', deviceId);
                            const wallet = await wasmService.generateWallet(deviceId, 'ethereum');
                            console.log('WASM 生成的钱包:', wallet);
                        } catch (error) {
                            console.error('WASM 测试失败:', error);
                        }
                    }}
                >
                    测试 WASM
                </Button>
            </Box>
        </Box>
    );
}; 