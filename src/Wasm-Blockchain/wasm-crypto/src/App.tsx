import { useState, useEffect } from 'react';
import { generateWallet, WalletInfo, signMessage, verifySignature, SignatureInfo } from './utils/wallet';
import { generateMnemonicFromDeviceId, validateDeviceId, validateMnemonic, validateDeviceInfo } from './utils/mnemonic';
import { initWasm } from './wasm/wallet';
import { LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

interface ErrorState {
  message: string;
  details?: string;
}

function App() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [blockchainType, setBlockchainType] = useState('ETH');
  const [messageToSign, setMessageToSign] = useState('');
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Generate device ID when component mounts
  useEffect(() => {
    const generateDeviceId = async () => {
      try {
        // Get browser information
        const deviceInfo = {
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: (navigator as any).deviceMemory
        };

        // Validate device info
        const deviceInfoValidation = validateDeviceInfo(deviceInfo);
        if (!deviceInfoValidation.isValid) {
          throw new Error(`Invalid device info: ${deviceInfoValidation.errors.join(', ')}`);
        }

        // Create a unique device ID using the collected information
        const deviceIdString = Object.values(deviceInfo)
          .filter(value => value !== undefined)
          .join('|');

        // Create a hash of the device info
        let hash = 0;
        for (let i = 0; i < deviceIdString.length; i++) {
          const char = deviceIdString.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }

        // Convert hash to a string and ensure it's positive and at least 10 characters
        let newDeviceId = Math.abs(hash).toString(36);

        // Pad the device ID if it's too short
        while (newDeviceId.length < 10) {
          newDeviceId = '0' + newDeviceId;
        }

        // Validate the generated device ID
        const deviceIdValidation = validateDeviceId(newDeviceId);
        if (!deviceIdValidation.isValid) {
          throw new Error(`Invalid device ID generated: ${deviceIdValidation.errors.join(', ')}`);
        }

        setDeviceId(newDeviceId);

        // Generate mnemonic from device ID
        const newMnemonic = await generateMnemonicFromDeviceId(newDeviceId);

        // Validate the generated mnemonic
        const mnemonicValidation = validateMnemonic(newMnemonic);
        if (!mnemonicValidation.isValid) {
          throw new Error(`Invalid mnemonic generated: ${mnemonicValidation.errors.join(', ')}`);
        }

        setMnemonic(newMnemonic);
      } catch (err) {
        console.error('Error generating device ID:', err);
        setError({
          message: 'Failed to generate device ID',
          details: err instanceof Error ? err.message : undefined
        });
      }
    };

    generateDeviceId();
  }, []);

  // 初始化WASM模块
  useEffect(() => {
    const init = async () => {
      try {
        await initWasm();
        console.log('WASM module initialized successfully');
      } catch (error) {
        console.error('Failed to initialize WASM module:', error);
        setError({
          message: 'Failed to initialize WASM module',
          details: error instanceof Error ? error.message : undefined
        });
      }
    };
    init();
  }, []);

  const handleGenerateWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate device ID
      const deviceIdValidation = validateDeviceId(deviceId);
      if (!deviceIdValidation.isValid) {
        throw new Error(`Invalid device ID: ${deviceIdValidation.errors.join(', ')}`);
      }

      // Validate mnemonic
      const mnemonicValidation = validateMnemonic(mnemonic);
      if (!mnemonicValidation.isValid) {
        throw new Error(`Invalid mnemonic: ${mnemonicValidation.errors.join(', ')}`);
      }

      // 使用WASM实现生成钱包
      const newWallet = await generateWallet(mnemonic, blockchainType);
      setWallet(newWallet);
    } catch (err) {
      console.error('Error generating wallet:', err);
      setError({
        message: err instanceof Error ? err.message : 'Failed to generate wallet',
        details: err instanceof Error ? err.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      setError({
        message: 'Failed to copy to clipboard',
        details: err instanceof Error ? err.message : undefined
      });
    }
  };

  const handleSignMessage = async () => {
    if (!wallet || !messageToSign.trim()) {
      setError({
        message: 'Please generate a wallet and enter a message to sign',
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await signMessage(wallet.address, messageToSign, wallet.private_key);
      setSignatureInfo(result);
    } catch (err) {
      console.error('Error signing message:', err);
      setError({
        message: err instanceof Error ? err.message : 'Failed to sign message',
        details: err instanceof Error ? err.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignature = async () => {
    if (!wallet || !signatureInfo) {
      setError({
        message: 'Please generate a wallet and sign a message first',
      });
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      const result = await verifySignature(wallet.address, signatureInfo.message, signatureInfo.signature);
      setVerificationResult(result);
    } catch (err) {
      console.error('Error verifying signature:', err);
      setError({
        message: err instanceof Error ? err.message : 'Failed to verify signature',
        details: err instanceof Error ? err.stack : undefined
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-2xl font-bold mb-8 text-center">Ethereum Wallet Generator</h1>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Device ID:</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm break-all flex justify-between items-center">
                      <span className="flex-1">{deviceId || 'Not generated yet'}</span>
                      {deviceId && (
                        <button
                          onClick={() => handleCopyToClipboard(deviceId)}
                          className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mnemonic:</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm break-all flex justify-between items-center">
                      <span className="flex-1">{mnemonic || 'Not generated yet'}</span>
                      {mnemonic && (
                        <button
                          onClick={() => handleCopyToClipboard(mnemonic)}
                          className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blockchain Type:</label>
                    <select
                      value={blockchainType}
                      onChange={(e) => setBlockchainType(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="ETH">Ethereum</option>
                      <option value="BSC">Binance Smart Chain</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateWallet}
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {isLoading ? 'Generating...' : 'Generate Wallet'}
                  </button>
                </div>

                {wallet && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Wallet Address:</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm break-all flex justify-between items-center">
                        <span className="flex-1">{wallet.address}</span>
                        <button
                          onClick={() => handleCopyToClipboard(wallet.address)}
                          className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Public Key:</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm break-all flex justify-between items-center">
                        <span className="flex-1">{wallet.public_key}</span>
                        <button
                          onClick={() => handleCopyToClipboard(wallet.public_key)}
                          className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Private Key:</label>
                        <button
                          type="button"
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showPrivateKey ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          value={showPrivateKey ? wallet.private_key : '••••••••••••••••'}
                          disabled
                          type={showPrivateKey ? 'text' : 'password'}
                          className="font-mono text-sm bg-gray-50 dark:bg-gray-700"
                        />
                        <button
                          onClick={() => handleCopyToClipboard(wallet.private_key)}
                          className="hover:bg-gray-100 dark:hover:bg-gray-600"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 mt-1">
                        <LockOutlined />
                        <span>请妥善保管私钥，不要分享给他人</span>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Digital Signature</h2>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Message to Sign:</label>
                          <textarea
                            value={messageToSign}
                            onChange={(e) => setMessageToSign(e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            rows={3}
                            placeholder="Enter message to sign..."
                          />
                        </div>

                        <button
                          onClick={handleSignMessage}
                          disabled={isLoading || !messageToSign.trim()}
                          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isLoading ? 'Signing...' : 'Sign Message'}
                        </button>

                        {signatureInfo && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Signature:</label>
                              <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm break-all flex justify-between items-center">
                                <span className="flex-1">{signatureInfo.signature}</span>
                                <button
                                  onClick={() => handleCopyToClipboard(signatureInfo.signature)}
                                  className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Message Hash:</label>
                              <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm break-all flex justify-between items-center">
                                <span className="flex-1">{signatureInfo.messageHash}</span>
                                <button
                                  onClick={() => handleCopyToClipboard(signatureInfo.messageHash)}
                                  className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                                >
                                  Copy
                                </button>
                              </div>
                            </div>

                            <button
                              onClick={handleVerifySignature}
                              disabled={isVerifying}
                              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              {isVerifying ? 'Verifying...' : 'Verify Signature'}
                            </button>

                            {verificationResult !== null && (
                              <div className={`p-4 rounded-md ${verificationResult ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                }`}>
                                <p className="text-sm font-medium">
                                  {verificationResult ? 'Signature verified successfully!' : 'Signature verification failed!'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error.message}</p>
                          {error.details && (
                            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                              {error.details}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
