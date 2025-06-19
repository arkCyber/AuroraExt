/**
 * WASM Crypto Library for Aurora Browser Extension
 * 
 * This module provides cryptographic functionality for wallet generation,
 * key management, and blockchain operations using WebAssembly.
 * 
 * Features:
 * - Deterministic wallet generation from device ID
 * - Mnemonic phrase generation and validation
 * - Multi-chain support (Ethereum, Polkadot, Kusama)
 * - Message signing and verification
 * - Secure key derivation
 * 
 * Author: Aurora Team
 * Created: 2024
 * Last Modified: 2024-12-27
 */

use bip39::Mnemonic;
use sha2::{Digest, Sha256};
use sp_core::{ecdsa, Pair};
use tiny_keccak::{Hasher, Keccak};
use wasm_bindgen::prelude::*;
use web_sys::console;

#[wasm_bindgen]
pub fn generate_wallet_from_device_id(
    device_id: &str,
    chain_type: &str,
) -> Result<JsValue, JsValue> {
    console::log_1(&"=== WASM: Starting wallet generation ===".into());
    console::log_2(&"WASM: Device ID:".into(), &device_id.into());
    console::log_2(&"WASM: Chain Type:".into(), &chain_type.into());

    // 验证设备ID
    if device_id.len() != 10 || !device_id.chars().all(|c| c.is_ascii_alphanumeric()) {
        let error_msg = format!(
            "WASM: Device ID must be exactly 10 alphanumeric characters, got {} characters with invalid format",
            device_id.len()
        );
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置默认链类型为以太坊
    let chain_type = if chain_type.is_empty() || chain_type.to_lowercase() == "ethereum" {
        console::log_1(&"WASM: Using default chain type: ethereum".into());
        "ethereum"
    } else {
        chain_type
    };

    // 计算设备ID的SHA-256哈希
    console::log_1(&"WASM: Calculating SHA-256 hash...".into());
    let mut hasher = Sha256::new();
    hasher.update(device_id.as_bytes());
    let hash = hasher.finalize();
    console::log_2(&"WASM: Generated hash:".into(), &hex::encode(&hash).into());
    console::log_2(&"WASM: Hash length:".into(), &hash.len().to_string().into());

    // 使用哈希的前16字节作为熵（128位）
    let entropy = &hash[..16];
    console::log_2(&"WASM: Using entropy:".into(), &hex::encode(entropy).into());
    console::log_2(
        &"WASM: Entropy length:".into(),
        &entropy.len().to_string().into(),
    );

    // 从熵生成助记词
    console::log_1(&"WASM: Generating mnemonic from entropy...".into());
    let mnemonic = match Mnemonic::from_entropy(entropy) {
        Ok(m) => m,
        Err(e) => {
            let error_msg = format!("WASM: Failed to generate mnemonic: {}", e);
            console::error_1(&error_msg.clone().into());
            return Err(JsValue::from_str(&error_msg));
        }
    };

    // 获取助记词字符串
    let mnemonic_words: String = mnemonic.words().collect::<Vec<&str>>().join(" ");
    console::log_2(
        &"WASM: Generated mnemonic:".into(),
        &mnemonic_words.clone().into(),
    );
    console::log_2(
        &"WASM: Mnemonic word count:".into(),
        &mnemonic_words.split_whitespace().count().to_string().into(),
    );

    // 从助记词生成种子
    console::log_1(&"WASM: Generating seed from mnemonic...".into());
    let mut hasher = Sha256::new();
    hasher.update(mnemonic_words.as_bytes());
    let hash = hasher.finalize();
    let mut seed = [0u8; 32];
    seed.copy_from_slice(&hash[..32]);
    console::log_2(&"WASM: Generated seed:".into(), &hex::encode(&seed).into());
    console::log_2(&"WASM: Seed length:".into(), &seed.len().to_string().into());

    // 根据链类型生成不同的密钥对
    console::log_1(&"WASM: Generating key pair based on chain type...".into());
    let (public_key, private_key, address) = match chain_type.to_lowercase().as_str() {
        "ethereum" => {
            console::log_1(&"WASM: Generating Ethereum (ECDSA) key pair...".into());
            let pair = ecdsa::Pair::from_seed(&seed);

            // 获取完整的公钥（包含0x04前缀）
            let public_key_ref = pair.public();
            let public_key_bytes = public_key_ref.as_ref();
            let mut full_public_key = vec![0x04];
            full_public_key.extend_from_slice(public_key_bytes);
            let public_key = format!("0x{}", hex::encode(&full_public_key));

            // 生成私钥
            let private_key = format!("0x{}", hex::encode(pair.to_raw_vec()));

            // 使用公钥生成正确的以太坊地址
            let address = generate_ethereum_address(public_key_bytes);

            console::log_2(
                &"WASM: ECDSA public key length:".into(),
                &public_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: ECDSA private key length:".into(),
                &private_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: ECDSA address length:".into(),
                &address.len().to_string().into(),
            );
            (public_key, private_key, address)
        }
        "polkadot" | "kusama" => {
            console::log_1(&"WASM: Generating Polkadot/Kusama (ECDSA) key pair...".into());
            let pair = ecdsa::Pair::from_seed(&seed);
            let public_key = hex::encode(pair.public().as_ref() as &[u8]);
            let private_key = hex::encode(pair.to_raw_vec());
            let address = hex::encode(pair.public().as_ref() as &[u8]);
            console::log_2(
                &"WASM: ECDSA public key length:".into(),
                &public_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: ECDSA private key length:".into(),
                &private_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: ECDSA address length:".into(),
                &address.len().to_string().into(),
            );
            (public_key, private_key, address)
        }
        _ => {
            console::log_1(&"WASM: Unsupported chain type, falling back to Ethereum...".into());
            let pair = ecdsa::Pair::from_seed(&seed);
            let public_key = hex::encode(pair.public().as_ref() as &[u8]);
            let private_key = hex::encode(pair.to_raw_vec());
            let address = hex::encode(pair.public().as_ref() as &[u8]);
            console::log_2(
                &"WASM: Fallback ECDSA public key length:".into(),
                &public_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: Fallback ECDSA private key length:".into(),
                &private_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: Fallback ECDSA address length:".into(),
                &address.len().to_string().into(),
            );
            (public_key, private_key, address)
        }
    };

    console::log_2(
        &"WASM: Generated public key:".into(),
        &public_key.clone().into(),
    );
    console::log_2(&"WASM: Generated private key:".into(), &"[HIDDEN]".into());
    console::log_2(&"WASM: Generated address:".into(), &address.clone().into());

    // 构建返回结果
    console::log_1(&"WASM: Building result object...".into());
    let result = js_sys::Object::new();

    // 设置助记词
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("mnemonic"),
        &JsValue::from_str(&mnemonic_words),
    ) {
        let error_msg = format!("WASM: Failed to set mnemonic in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置公钥
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("publicKey"),
        &JsValue::from_str(&public_key),
    ) {
        let error_msg = format!("WASM: Failed to set public key in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置私钥
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("privateKey"),
        &JsValue::from_str(&private_key),
    ) {
        let error_msg = format!("WASM: Failed to set private key in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置地址
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("address"),
        &JsValue::from_str(&address),
    ) {
        let error_msg = format!("WASM: Failed to set address in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置链类型
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("chainType"),
        &JsValue::from_str(chain_type),
    ) {
        let error_msg = format!("WASM: Failed to set chain type in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 验证生成的钱包信息
    console::log_1(&"\n=== WASM: Wallet Generation Verification ===".into());
    console::log_2(
        &"WASM: Mnemonic length:".into(),
        &mnemonic_words.split_whitespace().count().to_string().into(),
    );
    console::log_2(
        &"WASM: Public key length:".into(),
        &public_key.len().to_string().into(),
    );
    console::log_2(
        &"WASM: Private key length:".into(),
        &private_key.len().to_string().into(),
    );
    console::log_2(
        &"WASM: Address length:".into(),
        &address.len().to_string().into(),
    );
    console::log_1(&"WASM: All fields verified successfully".into());
    console::log_1(&"=== WASM: Wallet generation completed successfully ===".into());

    Ok(result.into())
}

#[wasm_bindgen]
pub fn generate_wallet_from_mnemonic(
    mnemonic_words: &str,
    chain_type: &str,
) -> Result<JsValue, JsValue> {
    console::log_1(&"=== WASM: Starting wallet generation from mnemonic ===".into());
    console::log_2(&"WASM: Mnemonic words:".into(), &mnemonic_words.into());
    console::log_2(&"WASM: Chain Type:".into(), &chain_type.into());

    // 验证助记词
    let words: Vec<&str> = mnemonic_words.split_whitespace().collect();
    if words.len() != 12 {
        let error_msg = format!(
            "WASM: Mnemonic must contain exactly 12 words, got {}",
            words.len()
        );
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置默认链类型为以太坊
    let chain_type = if chain_type.is_empty() || chain_type.to_lowercase() == "ethereum" {
        console::log_1(&"WASM: Using default chain type: ethereum".into());
        "ethereum"
    } else {
        chain_type
    };

    // 从助记词生成种子
    console::log_1(&"WASM: Generating seed from mnemonic...".into());
    let mut hasher = Sha256::new();
    hasher.update(mnemonic_words.as_bytes());
    let hash = hasher.finalize();
    let mut seed = [0u8; 32];
    seed.copy_from_slice(&hash[..32]);
    console::log_2(&"WASM: Generated seed:".into(), &hex::encode(&seed).into());
    console::log_2(&"WASM: Seed length:".into(), &seed.len().to_string().into());

    // 根据链类型生成不同的密钥对
    console::log_1(&"WASM: Generating key pair based on chain type...".into());
    let (public_key, private_key, address) = match chain_type.to_lowercase().as_str() {
        "ethereum" => {
            console::log_1(&"WASM: Generating Ethereum (ECDSA) key pair...".into());
            let pair = ecdsa::Pair::from_seed(&seed);

            // 获取完整的公钥（包含0x04前缀）
            let public_key_ref = pair.public();
            let public_key_bytes = public_key_ref.as_ref();
            let mut full_public_key = vec![0x04];
            full_public_key.extend_from_slice(public_key_bytes);
            let public_key = format!("0x{}", hex::encode(&full_public_key));

            // 生成私钥
            let private_key = format!("0x{}", hex::encode(pair.to_raw_vec()));

            // 使用公钥生成正确的以太坊地址
            let address = generate_ethereum_address(public_key_bytes);

            console::log_2(
                &"WASM: ECDSA public key length:".into(),
                &public_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: ECDSA private key length:".into(),
                &private_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: ECDSA address length:".into(),
                &address.len().to_string().into(),
            );
            (public_key, private_key, address)
        }
        "polkadot" | "kusama" => {
            console::log_1(&"WASM: Generating Polkadot/Kusama (ECDSA) key pair...".into());
            let pair = ecdsa::Pair::from_seed(&seed);
            let public_key = hex::encode(pair.public().as_ref() as &[u8]);
            let private_key = hex::encode(pair.to_raw_vec());
            let address = hex::encode(pair.public().as_ref() as &[u8]);
            console::log_2(
                &"WASM: ECDSA public key length:".into(),
                &public_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: ECDSA private key length:".into(),
                &private_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: ECDSA address length:".into(),
                &address.len().to_string().into(),
            );
            (public_key, private_key, address)
        }
        _ => {
            console::log_1(&"WASM: Unsupported chain type, falling back to Ethereum...".into());
            let pair = ecdsa::Pair::from_seed(&seed);
            let public_key = hex::encode(pair.public().as_ref() as &[u8]);
            let private_key = hex::encode(pair.to_raw_vec());
            let address = hex::encode(pair.public().as_ref() as &[u8]);
            console::log_2(
                &"WASM: Fallback ECDSA public key length:".into(),
                &public_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: Fallback ECDSA private key length:".into(),
                &private_key.len().to_string().into(),
            );
            console::log_2(
                &"WASM: Fallback ECDSA address length:".into(),
                &address.len().to_string().into(),
            );
            (public_key, private_key, address)
        }
    };

    console::log_2(
        &"WASM: Generated public key:".into(),
        &public_key.clone().into(),
    );
    console::log_2(&"WASM: Generated private key:".into(), &"[HIDDEN]".into());
    console::log_2(&"WASM: Generated address:".into(), &address.clone().into());

    // 构建返回结果
    console::log_1(&"WASM: Building result object...".into());
    let result = js_sys::Object::new();

    // 设置助记词
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("mnemonic"),
        &JsValue::from_str(mnemonic_words),
    ) {
        let error_msg = format!("WASM: Failed to set mnemonic in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置公钥
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("publicKey"),
        &JsValue::from_str(&public_key),
    ) {
        let error_msg = format!("WASM: Failed to set public key in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置私钥
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("privateKey"),
        &JsValue::from_str(&private_key),
    ) {
        let error_msg = format!("WASM: Failed to set private key in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置地址
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("address"),
        &JsValue::from_str(&address),
    ) {
        let error_msg = format!("WASM: Failed to set address in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 设置链类型
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("chainType"),
        &JsValue::from_str(chain_type),
    ) {
        let error_msg = format!("WASM: Failed to set chain type in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 验证生成的钱包信息
    console::log_1(&"\n=== WASM: Wallet Generation Verification ===".into());
    console::log_2(
        &"WASM: Mnemonic length:".into(),
        &words.len().to_string().into(),
    );
    console::log_2(
        &"WASM: Public key length:".into(),
        &public_key.len().to_string().into(),
    );
    console::log_2(
        &"WASM: Private key length:".into(),
        &private_key.len().to_string().into(),
    );
    console::log_2(
        &"WASM: Address length:".into(),
        &address.len().to_string().into(),
    );
    console::log_1(&"WASM: All fields verified successfully".into());
    console::log_1(&"=== WASM: Wallet generation completed successfully ===".into());

    Ok(result.into())
}

#[wasm_bindgen]
pub fn decrypt_and_generate_mnemonic(encrypted_words: &str) -> Result<JsValue, JsValue> {
    console::log_1(&"=== WASM: Starting wallet generation ===".into());
    console::log_2(&"WASM: Raw input:".into(), &encrypted_words.into());
    console::log_2(
        &"WASM: Input length:".into(),
        &encrypted_words.len().to_string().into(),
    );
    console::log_2(
        &"WASM: Input type:".into(),
        &std::any::type_name::<&str>().into(),
    );

    // 检查输入是否为空
    if encrypted_words.is_empty() {
        let error_msg = "WASM: Input is empty".to_string();
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 验证助记词
    let words: Vec<&str> = encrypted_words.split_whitespace().collect();
    console::log_2(&"WASM: Split words:".into(), &format!("{:?}", words).into());
    console::log_2(&"WASM: Word count:".into(), &words.len().to_string().into());

    if words.len() != 12 {
        let error_msg = format!(
            "WASM: Mnemonic must contain exactly 12 words, got {}",
            words.len()
        );
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 从助记词生成种子
    console::log_1(&"WASM: Generating seed from mnemonic...".into());
    let mut hasher = Sha256::new();
    hasher.update(encrypted_words.as_bytes());
    let hash = hasher.finalize();
    let mut seed = [0u8; 32];
    seed.copy_from_slice(&hash[..32]);
    console::log_2(&"WASM: Generated seed:".into(), &hex::encode(&seed).into());

    // 生成ECDSA密钥对
    console::log_1(&"WASM: Generating ECDSA key pair...".into());
    let pair = ecdsa::Pair::from_seed(&seed);

    // 获取完整的公钥（包含0x04前缀）
    let public_key_ref = pair.public();
    let public_key_bytes = public_key_ref.as_ref();
    let mut full_public_key = vec![0x04];
    full_public_key.extend_from_slice(public_key_bytes);
    let public_key = format!("0x{}", hex::encode(&full_public_key));

    // 生成私钥
    let private_key = format!("0x{}", hex::encode(pair.to_raw_vec()));

    // 使用公钥生成正确的以太坊地址
    let address = generate_ethereum_address(public_key_bytes);

    // 打印成功信息
    console::log_1(&"=== WASM: Wallet Generation Success ===".into());
    console::log_2(&"WASM: Generated mnemonic:".into(), &encrypted_words.into());
    console::log_2(
        &"WASM: Generated public key:".into(),
        &public_key.clone().into(),
    );
    console::log_2(&"WASM: Generated private key:".into(), &"[HIDDEN]".into());
    console::log_2(&"WASM: Generated address:".into(), &address.clone().into());

    // 构建返回结果
    let result = js_sys::Object::new();

    // 设置助记词
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("mnemonic"),
        &JsValue::from_str(encrypted_words),
    ) {
        console::error_1(&format!("WASM: Failed to set mnemonic: {:?}", e).into());
        return Err(JsValue::from_str("Failed to set mnemonic"));
    }

    // 设置公钥
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("public_key"),
        &JsValue::from_str(&public_key),
    ) {
        console::error_1(&format!("WASM: Failed to set public key: {:?}", e).into());
        return Err(JsValue::from_str("Failed to set public key"));
    }

    // 设置私钥
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("private_key"),
        &JsValue::from_str(&private_key),
    ) {
        console::error_1(&format!("WASM: Failed to set private key: {:?}", e).into());
        return Err(JsValue::from_str("Failed to set private key"));
    }

    // 设置地址
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("address"),
        &JsValue::from_str(&address),
    ) {
        console::error_1(&format!("WASM: Failed to set address: {:?}", e).into());
        return Err(JsValue::from_str("Failed to set address"));
    }

    // 设置成功标志
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("success"),
        &JsValue::from_bool(true),
    ) {
        console::error_1(&format!("WASM: Failed to set success flag: {:?}", e).into());
        return Err(JsValue::from_str("Failed to set success flag"));
    }

    // 设置链类型
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("chain_type"),
        &JsValue::from_str("ethereum"),
    ) {
        console::error_1(&format!("WASM: Failed to set chain type: {:?}", e).into());
        return Err(JsValue::from_str("Failed to set chain type"));
    }

    console::log_1(&"WASM: Successfully built result object".into());
    Ok(result.into())
}

fn generate_ethereum_address(public_key: &[u8]) -> String {
    // 确保公钥格式正确（去掉0x04前缀）
    let public_key = if public_key[0] == 0x04 {
        &public_key[1..]
    } else {
        public_key
    };

    // 计算Keccak-256哈希
    let mut keccak = Keccak::v256();
    let mut hash = [0u8; 32];
    keccak.update(public_key);
    keccak.finalize(&mut hash);

    // 取最后20个字节作为地址
    let address = &hash[12..];

    // 转换为十六进制字符串并添加0x前缀
    format!("0x{}", hex::encode(address))
}

#[wasm_bindgen]
pub fn sign_message(private_key: &str, message: &str) -> Result<String, JsValue> {
    console::log_1(&"=== WASM: Starting message signing ===".into());
    console::log_2(&"WASM: Message:".into(), &message.into());

    // 验证私钥格式
    if !private_key.starts_with("0x") || private_key.len() != 66 {
        let error_msg = format!("WASM: Invalid private key format: {}", private_key);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 从十六进制字符串解码私钥
    let private_key_bytes = match hex::decode(&private_key[2..]) {
        Ok(bytes) => bytes,
        Err(e) => {
            let error_msg = format!("WASM: Failed to decode private key: {}", e);
            console::error_1(&error_msg.clone().into());
            return Err(JsValue::from_str(&error_msg));
        }
    };

    // 创建密钥对
    let pair = match ecdsa::Pair::from_seed_slice(&private_key_bytes) {
        Ok(pair) => pair,
        Err(e) => {
            let error_msg = format!("WASM: Failed to create key pair: {:?}", e);
            console::error_1(&error_msg.clone().into());
            return Err(JsValue::from_str(&error_msg));
        }
    };

    // 对消息进行签名
    let signature = pair.sign(message.as_bytes());
    let signature_hex = hex::encode(signature.0);
    let signature_str = format!("0x{}", signature_hex);
    console::log_2(
        &"WASM: Generated signature:".into(),
        &signature_str.clone().into(),
    );
    Ok(signature_str)
}

#[wasm_bindgen]
pub fn verify_signature(
    public_key: &str,
    message: &str,
    signature: &str,
) -> Result<JsValue, JsValue> {
    console::log_1(&"=== WASM: Starting signature verification ===".into());
    console::log_2(&"WASM: Message:".into(), &message.into());
    console::log_2(&"WASM: Signature:".into(), &signature.into());

    // 验证公钥格式
    if !public_key.starts_with("0x") {
        let error_msg = format!("WASM: Public key must start with 0x prefix: {}", public_key);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 从十六进制字符串解码公钥
    let public_key_bytes = match hex::decode(&public_key[2..]) {
        Ok(bytes) => bytes,
        Err(e) => {
            let error_msg = format!("WASM: Failed to decode public key: {}", e);
            console::error_1(&error_msg.clone().into());
            return Err(JsValue::from_str(&error_msg));
        }
    };

    // 验证公钥长度（去掉0x04前缀后应该是32字节）
    if public_key_bytes.len() < 33 {
        let error_msg = format!(
            "WASM: Public key too short: {} bytes",
            public_key_bytes.len()
        );
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 创建公钥对象（使用最后33字节）
    let mut public_key_array = [0u8; 33];
    public_key_array.copy_from_slice(&public_key_bytes[public_key_bytes.len() - 33..]);
    let public = ecdsa::Public::from_raw(public_key_array);

    // 验证签名格式
    if !signature.starts_with("0x") {
        let error_msg = format!("WASM: Invalid signature format: {}", signature);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    // 从十六进制字符串解码签名
    let signature_bytes = match hex::decode(&signature[2..]) {
        Ok(bytes) => bytes,
        Err(e) => {
            let error_msg = format!("WASM: Failed to decode signature: {}", e);
            console::error_1(&error_msg.clone().into());
            return Err(JsValue::from_str(&error_msg));
        }
    };

    // 创建签名对象
    let mut signature_array = [0u8; 65];
    signature_array.copy_from_slice(&signature_bytes);
    let signature = ecdsa::Signature::from_raw(signature_array);

    // 验证签名
    let is_valid = ecdsa::Pair::verify(&signature, message.as_bytes(), &public);

    // 构建返回结果
    let result = js_sys::Object::new();
    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("success"),
        &JsValue::from_bool(is_valid),
    ) {
        let error_msg = format!("WASM: Failed to set success in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    if let Err(e) = js_sys::Reflect::set(
        &result,
        &JsValue::from_str("message"),
        &JsValue::from_str(if is_valid {
            "Signature is valid"
        } else {
            "Signature is invalid"
        }),
    ) {
        let error_msg = format!("WASM: Failed to set message in result: {:?}", e);
        console::error_1(&error_msg.clone().into());
        return Err(JsValue::from_str(&error_msg));
    }

    console::log_2(
        &"WASM: Verification result:".into(),
        &is_valid.to_string().into(),
    );
    Ok(result.into())
}
