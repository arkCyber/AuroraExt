import bip39 from 'bip39';

// 测试生成助记词
const entropy = bip39.generateMnemonic();
console.log('Generated mnemonic:', entropy);

// 测试验证助记词
const isValid = bip39.validateMnemonic(entropy);
console.log('Is valid mnemonic:', isValid);

// 测试词列表
console.log('First 5 words from wordlist:', bip39.wordlists.english.slice(0, 5)); 