/**
 * 获取设备唯一标识符
 * @returns Promise<string> 设备ID
 */
export const getDeviceId = async (): Promise<string> => {
    try {
        // 尝试从 localStorage 获取已存储的设备 ID
        const storedId = localStorage.getItem('device_id');
        if (storedId) {
            return storedId;
        }

        // 生成新的设备 ID
        const newId = await generateDeviceId();

        // 存储设备 ID
        localStorage.setItem('device_id', newId);

        return newId;
    } catch (error) {
        console.error('Failed to get device ID:', error);
        throw error;
    }
};

/**
 * 生成设备唯一标识符
 * @returns Promise<string> 设备ID
 */
const generateDeviceId = async (): Promise<string> => {
    try {
        // 获取浏览器信息
        const deviceInfo = {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: (navigator as any).deviceMemory
        };

        // 将设备信息转换为字符串，移除所有连字符
        const deviceIdString = Object.values(deviceInfo)
            .filter(value => value !== undefined)
            .join('')
            .replace(/-/g, ''); // 移除所有连字符

        // 使用 SHA-256 生成哈希
        const encoder = new TextEncoder();
        const data = encoder.encode(deviceIdString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);

        // 将哈希转换为 base36 字符串
        let deviceId = '';
        for (let i = 0; i < 10; i++) {
            // 使用哈希值生成一个 0-35 之间的数字
            const value = hashArray[i] % 36;
            // 将数字转换为 base36 字符（0-9 或 a-z）
            deviceId += value < 10 ? value.toString() : (value - 10 + 10).toString(36);
        }

        // 验证生成的设备ID
        if (!/^[a-zA-Z0-9]{10}$/.test(deviceId)) {
            throw new Error('Generated device ID does not match required format');
        }

        return deviceId;
    } catch (error) {
        console.error('Failed to generate device ID:', error);
        throw error;
    }
}; 