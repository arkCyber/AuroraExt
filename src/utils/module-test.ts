import { createHash } from 'crypto';

// 测试 bip39 模块的可用性
async function testBip39Module() {
    try {
        // 尝试动态导入 bip39
        const bip39 = await import('bip39');
        console.log('bip39 module loaded successfully:', bip39);

        // 测试基本功能
        const mnemonic = bip39.generateMnemonic();
        console.log('Generated mnemonic:', mnemonic);

        const isValid = bip39.validateMnemonic(mnemonic);
        console.log('Mnemonic validation:', isValid);

        return true;
    } catch (error) {
        console.error('Error loading bip39 module:', error);
        return false;
    }
}

// 测试模块解析路径
async function testModuleResolution() {
    try {
        // 测试不同的导入方式
        const importMethods = [
            "import bip39 from 'bip39'",
            "import * as bip39 from 'bip39'",
            "import bip39 from '/node_modules/bip39/index.js'",
            "import bip39 from '../node_modules/bip39/index.js'"
        ];

        for (const method of importMethods) {
            try {
                console.log(`Testing import method: ${method}`);
                const result = await eval(`(async () => { ${method} })()`);
                console.log(`Success with method: ${method}`);
            } catch (error) {
                console.error(`Failed with method ${method}:`, error);
            }
        }
    } catch (error) {
        console.error('Error in module resolution test:', error);
    }
}

// 运行测试
async function runTests() {
    console.log('Starting module tests...');

    console.log('\nTesting bip39 module availability:');
    const bip39Available = await testBip39Module();
    console.log('bip39 module available:', bip39Available);

    console.log('\nTesting module resolution:');
    await testModuleResolution();
}

// 执行测试
runTests().catch(console.error); 