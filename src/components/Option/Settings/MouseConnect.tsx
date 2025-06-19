// 
// zczc 
// abandon ability able about above absent absorb abstract absurd abuse access acid 
// nnnn

/**
 * @module MouseConnect
 * @description Mouse connection component for wallet generation and DID verification
 * @version 1.0.9
 * @author arkSong
 * 
 * @remarks
 * This module handles:
 * - Mouse device ID input validation
 * - WASM wallet generation from device ID
 * - DID identity creation and verification
 * - Wallet status checking and storage
 * 
 * @dependencies
 * - WasmService - For WASM crypto operations
 * - Chrome Storage - For wallet info persistence
 * - React - For component rendering
 * - i18next - For translations
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WasmService } from '@/services/wasm-service';
import * as bip39 from 'bip39';

// Create a Set of BIP39 words for validation
const bip39Words = new Set(bip39.wordlists.english);

// 添加 WASM 模块类型声明
declare global {
    interface Window {
        wasmModule: {
            checkWalletStatus: () => Promise<boolean>;
            generateWallet: (mnemonic: string) => Promise<{
                success: boolean;
                message: string;
                data?: any;
            }>;
        };
    }
}

interface MouseConnectProps {
    onConfirm: (input: string) => Promise<any>;
    onCancel: () => void;
    deviceId: string;
}

interface WasmOutput {
    address: string;
    publicKey: string;
    privateKey: string;
    mnemonic: string;
    success: boolean;
}

interface WasmInfo {
    output?: WasmOutput;
    error?: string;
}

const MouseConnect: React.FC<MouseConnectProps> = ({ onConfirm, onCancel, deviceId }) => {
    const { t } = useTranslation("settings");
    const [inputValue, setInputValue] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [processMessage, setProcessMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedWords, setProcessedWords] = useState<string[]>([]);
    const [wasmInfo, setWasmInfo] = useState<WasmInfo>({
        output: undefined,
        error: undefined
    });

    const wasmService = WasmService.getInstance();

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = e.target.value;
        setInputValue(input);
        setErrorMessage('');
        setProcessMessage('');
        setShowSuccess(false);

        // 预处理：去除头尾空格、回车等空白字符
        const cleanedInput = input.trim().replace(/[\r\n]+/g, '');

        // 验证输入格式
        if (!cleanedInput.startsWith('zczc') || !cleanedInput.endsWith('nnnn')) {
            setErrorMessage("输入信息格式错误！");
            setIsValid(false);
            return;
        }

        // 提取中间部分（移除 zczc 和 nnnn）
        const middlePart = cleanedInput.slice(4, -4).trim();

        // 检查是否只包含英文字母和空格
        if (!/^[a-zA-Z\s]+$/.test(middlePart)) {
            setErrorMessage("只能包含英文字母和空格");
            setIsValid(false);
            return;
        }

        // 检查单词数量
        const words = middlePart.split(/\s+/).filter(word => word.length > 0);
        if (words.length !== 12) {
            setErrorMessage(`链接需要12个英文词组，当前有 ${words.length} 个`);
            setIsValid(false);
            return;
        }

        // Check if each word is a valid BIP39 word or needs decryption
        const bip39Words = new Set(bip39.wordlists.english);

        // Helper function to decrypt a word by shifting letters back 3 positions
        const decryptWord = (word: string): string => {
            console.log('Decrypting word:', word);
            const decrypted = word.toLowerCase().split('').map(char => {
                if (char >= 'a' && char <= 'z') {
                    // Shift back 3 positions, wrapping around from 'a' to 'z' if needed
                    const code = char.charCodeAt(0) - 3;
                    const decryptedChar = String.fromCharCode(code < 97 ? code + 26 : code);
                    console.log(`Decrypting character ${char} -> ${decryptedChar}`);
                    return decryptedChar;
                }
                return char;
            }).join('');
            console.log('Decrypted result:', decrypted);
            return decrypted;
        };

        // Process each word
        const newProcessedWords = words.map(word => {
            const lowerWord = word.toLowerCase();
            // If it's already a valid BIP39 word, keep it as is
            if (bip39Words.has(lowerWord)) {
                return lowerWord;
            }
            // Otherwise, try to decrypt it
            const decryptedWord = decryptWord(lowerWord);
            if (bip39Words.has(decryptedWord)) {
                return decryptedWord;
            }
            // If neither original nor decrypted word is valid, mark as invalid
            console.log(`Invalid word found: ${word}`);
            console.log(`Original word: ${word}, Decrypted word: ${decryptWord(word.toLowerCase())}`);
            setErrorMessage(`Invalid word in sequence: ${word}`);
            setIsValid(false);
            return null;
        });

        // Check if any words were invalid
        if (newProcessedWords.includes(null)) {
            return;
        }

        setProcessedWords(newProcessedWords.filter(word => word !== null) as string[]);
        setIsValid(true);
        setShowSuccess(true);
        setProcessMessage("输入格式验证通过，可以开始生成链接");
    };

    // Log the processed mnemonic words
    useEffect(() => {
        if (processedWords.length > 0) {
            console.log('Processed mnemonic words:', processedWords.join(' '));
        }
    }, [processedWords]);

    const handleSubmit = async () => {
        if (!isValid) {
            return;
        }

        try {
            setIsProcessing(true);
            setProcessMessage("正在检查链接状态...");
            setErrorMessage('');
            setWasmInfo(prev => ({ ...prev, error: undefined }));
            // 提取助记词：先检查前缀和后缀，再提取助记词
            const cleanedInput = inputValue.trim();

            // 检查是否包含必要的前缀和后缀
            if (!cleanedInput.startsWith('zczc') || !cleanedInput.endsWith('nnnn')) {
                setErrorMessage('输入格式错误: 必须以zczc开头且以nnnn结尾');
                return;
            }

            // 移除前缀和后缀并清理空格
            const mnemonic = cleanedInput
                .slice(4, -4) // 移除 zczc 和 nnnn
                .trim(); // 去除可能的空格
            // 再次验证是否为12个助记词
            const mnemonicWords = mnemonic.split(' ').filter(word => word.length > 0);
            if (mnemonicWords.length !== 12) {
                setErrorMessage(`助记词数量错误: 需要12个词，当前有${mnemonicWords.length}个词`);
                setProcessMessage("");
                return;
            }

            // 验证每个助记词是否在BIP39词库中
            console.log('Validating mnemonic words:', mnemonicWords);
            const invalidWords = mnemonicWords.filter(word => !bip39Words.has(word));
            console.log('Invalid words found:', invalidWords);
            if (invalidWords.length > 0) {
                console.log('Validation failed - invalid words detected');
                setErrorMessage(`发现无效的助记词: ${invalidWords.join(', ')}`);
                setProcessMessage("");
                return;
            }
            console.log('All mnemonic words validated successfully');

            // 更新WASM输入信息
            setWasmInfo(prev => ({
                ...prev,
                output: {
                    address: '',
                    publicKey: '',
                    privateKey: '',
                    mnemonic: mnemonic,
                    success: false
                }
            }));

            // 检查钱包是否已生成
            const walletStatus = await checkWalletStatus();
            if (walletStatus.isGenerated) {
                // 验证以太坊地址格式
                const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletStatus.address || '');
                // 验证公钥格式 
                const isValidPublicKey = /^0x[a-fA-F0-9]{130}$/.test(walletStatus.publicKey || '');
                // 验证私钥格式
                const isValidPrivateKey = /^0x[a-fA-F0-9]{64}$/.test(walletStatus.privateKey || '');

                if (!isValidAddress || !isValidPublicKey || !isValidPrivateKey) {
                    setErrorMessage("AI鼠标链接密钥验证失败，请重新生成！");
                    setProcessMessage("");
                    setWasmInfo(prev => ({
                        ...prev,
                        error: "AI鼠标链接密钥格式错误！"
                    }));
                    return;
                }

                setProcessMessage(`AI鼠标链接已存在且验证通过:
地址: ${walletStatus.address?.slice(0, 6) || ''}...${walletStatus.address?.slice(-4) || ''}
公钥: ${walletStatus.publicKey?.slice(0, 6) || ''}...${walletStatus.publicKey?.slice(-4) || ''}`);

                setWasmInfo(prev => ({
                    ...prev,
                    output: {
                        address: walletStatus.address || '',
                        publicKey: walletStatus.publicKey || '',
                        privateKey: walletStatus.privateKey || '',
                        mnemonic: walletStatus.mnemonic || '',
                        success: true
                    }
                }));

                // 更新父组件状态
                await onConfirm(mnemonic);
                return;
            }

            setProcessMessage("正在生成AI鼠标链接...");
            // 直接使用助记词生成钱包
            const result = await onConfirm(mnemonic);

            // 处理返回结果
            if (result.success) {
                setProcessMessage("AI鼠标链接生成成功！");
                setWasmInfo(prev => ({
                    ...prev,
                    output: {
                        address: result.data?.address || '',
                        publicKey: result.data?.publicKey || '',
                        privateKey: result.data?.privateKey || '',
                        mnemonic: result.data?.mnemonic || '',
                        success: true
                    }
                }));

                // 初始化钱包数据结构
                const walletData = {
                    company_address: result.data?.address || '',
                    company_publicKey: result.data?.publicKey || '',
                    company_privateKey: result.data?.privateKey || '',
                    company_mnemonic: result.data?.mnemonic || '',
                    company_deviceId: deviceId || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // 验证数据完整性
                if (!walletData.company_address || !walletData.company_publicKey || !walletData.company_privateKey) {
                    throw new Error('Wallet data is incomplete');
                }

                // 使用chrome.storage.local API将钱包信息保存到本地存储
                await chrome.storage.local.set({
                    wallet: walletData
                });

                // 从存储中读取并显示地址和公钥
                const storedData = await chrome.storage.local.get('wallet');
                if (storedData.wallet) {
                    console.log('=== 存储的企业钱包信息 ===');
                    console.log('企业DID地址:', storedData.wallet.company_address);
                    console.log('企业设备公钥:', storedData.wallet.company_publicKey);
                }

                // Update WASM info to show success message
                setWasmInfo(prev => ({
                    ...prev,
                    output: {
                        address: result.data?.address || '',
                        publicKey: result.data?.publicKey || '',
                        privateKey: result.data?.privateKey || '',
                        mnemonic: result.data?.mnemonic || '',
                        success: true
                    }
                }));
            } else {
                setErrorMessage(`AI鼠标链接操作失败: ${result.message}`);
                setProcessMessage("");
                setIsValid(false);
                setWasmInfo(prev => ({
                    ...prev,
                    error: result.message
                }));
            }
        } catch (error) {
            console.error('Failed to store wallet:', error);
            setWasmInfo(prev => ({
                ...prev,
                error: '保存AI鼠标链接信息失败，请重试'
            }));
        } finally {
            setIsProcessing(false);
            // 无论成功与否，都关闭对话框
            onCancel();
        }
    };

    // 添加检查钱包状态的函数
    const checkWalletStatus = async (): Promise<{
        isGenerated: boolean;
        address?: string;
        publicKey?: string;
        privateKey?: string;
        mnemonic?: string;
    }> => {
        try {
            // 从 chrome.storage.local 中获取钱包信息
            const result = await chrome.storage.local.get('walletInfo');
            const walletInfo = result.walletInfo;

            // 检查钱包信息是否完整且有效
            const isGenerated = !!walletInfo &&
                !!walletInfo.address &&
                !!walletInfo.publicKey &&
                !!walletInfo.mnemonic &&
                walletInfo.address.startsWith('0x') &&
                walletInfo.publicKey.startsWith('0x');

            if (isGenerated) {
                console.log('=== 链接状态检查 ===');
                console.log('地址:', walletInfo.address);
                console.log('公钥:', walletInfo.publicKey);
                console.log('助记词:', walletInfo.mnemonic);
                console.log('链类型:', walletInfo.chainType);
                console.log('===================');
            }

            return {
                isGenerated,
                address: walletInfo?.address,
                publicKey: walletInfo?.publicKey,
                privateKey: walletInfo?.privateKey,
                mnemonic: walletInfo?.mnemonic
            };
        } catch (error) {
            console.error('检查链接状态失败:', error);
            const errorMsg = error instanceof Error ? error.message : '未知错误';
            setWasmInfo(prev => ({
                ...prev,
                error: `检查鼠标链接状态失败: ${errorMsg}`
            }));
            return { isGenerated: false };
        }
    };

    // 处理输入框获取焦点
    const handleFocus = () => {
        // 尝试切换到英文输入法
        try {
            // 使用 execCommand 尝试切换输入法（某些浏览器支持）
            document.execCommand('imeMode', false, 'inactive');

            // 检查输入法状态
            const isEnglishInput = document.activeElement instanceof HTMLInputElement &&
                document.activeElement.type === 'text' &&
                document.activeElement.inputMode === 'text';

            if (isEnglishInput) {
                setProcessMessage("已成功切换到英文输入法");
            } else {
                setProcessMessage("请手动切换到英文输入法");
            }
        } catch (error) {
            console.log('自动切换输入法失败，请手动切换到英文输入法');
            setProcessMessage("请手动切换到英文输入法");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md p-6 bg-white border border-gray-600 rounded-lg shadow-xl dark:border-indigo-300 dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('personal.mouseConnectTitle', { defaultValue: 'Aurora软件链接AI鼠标' })}
                </h3>

                {/* 输入区域 */}
                <div className="mb-6">
                    <div className="mb-2">
                        <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                            {t('personal.mouseConnectGuide', { defaultValue: '操作指南：1、将输入法切换至英文状态；2、将光标置于输入框内，长按鼠标AI键3秒以上；3、按提示点击开始按钮；' })}
                        </div>
                    </div>
                    <textarea
                        className="w-full p-3 border rounded-md border-stone-300 focus:ring-1 focus:ring-stone-400 focus:border-stone-400 dark:bg-gray-700 dark:border-stone-600 dark:text-white"
                        rows={1}
                        placeholder={t('personal.enterEnglish', { defaultValue: 'Wait for AI Mouse Input ……' })}
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        disabled={isProcessing}
                    />
                    {errorMessage && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400">
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {errorMessage}
                            </span>
                        </div>
                    )}
                    {processMessage && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-blue-600 dark:text-blue-400">
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {processMessage}
                            </span>
                        </div>
                    )}
                    {showSuccess && !isProcessing && (
                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {t('personal.mouseConnectSuccess', { defaultValue: 'AI鼠标链接成功' })}
                                </span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                className="w-full px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('personal.startProcessing', { defaultValue: 'Start Processing开始处理' })}
                            </button>
                        </div>
                    )}
                </div>

                {/* WASM处理信息显示区域 */}
                {(wasmInfo.output || wasmInfo.error) && (
                    <div className="p-4 mb-6 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('personal.aiMouseLinkInfo', { defaultValue: 'AI鼠标链接信息' })}
                        </h4>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto scroll-smooth">
                            {wasmInfo.output && (
                                <div className="animate-slide-in">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">输出信息:</p>
                                    <p className="text-sm text-gray-700 break-all dark:text-gray-200">{wasmInfo.output.mnemonic}</p>
                                </div>
                            )}
                            {wasmInfo.output && wasmInfo.output.address && (
                                <div className="animate-slide-in">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">公司钱包地址:</p>
                                    <p className="text-sm text-gray-700 break-all dark:text-gray-200">{wasmInfo.output.address}</p>
                                </div>
                            )}
                            {wasmInfo.error && (
                                <div className="animate-slide-in">
                                    <p className="text-xs text-red-500 dark:text-red-400">错误信息:</p>
                                    <p className="text-sm text-red-600 break-all dark:text-red-300">{wasmInfo.error}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        disabled={isProcessing}
                    >
                        {t('personal.cancel', { defaultValue: 'Cancel取消' })}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || isProcessing}
                        className="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <span className="flex items-center">
                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t('personal.processing', { defaultValue: 'Processing处理中' })}
                            </span>
                        ) : (
                            t('personal.confirm', { defaultValue: 'Confirm确认' })
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MouseConnect; 