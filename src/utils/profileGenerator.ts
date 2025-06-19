import { UserProfile } from '../services/database';

// 生成数字点阵头像
export function generatePixelAvatar(seed: string): string {
    const size = 9; // 9x9 点阵
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB',
        '#2ECC71', '#F1C40F', '#E74C3C', '#1ABC9C'  // 添加更多颜色
    ];

    // 使用种子生成一个确定的颜色
    const seedSum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const backgroundColor = colors[seedSum % colors.length];
    const pixelColor = '#FFFFFF';

    // 创建 canvas，增加尺寸以获得更好的渲染效果
    const pixelSize = 12; // 调整每个点的大小以适应 9x9 网格
    const padding = pixelSize; // 添加内边距使圆形效果更好
    const canvasSize = size * pixelSize + padding * 2;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    if (!ctx) return '';

    // 创建圆形裁剪区域
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // 填充背景
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // 生成对称的点阵图案
    const matrix = Array(size).fill(0).map(() => Array(Math.ceil(size / 2)).fill(0));
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < Math.ceil(size / 2); j++) {
            // 使用更复杂的算法生成点阵，增加随机性但保持确定性
            const value = ((seedSum + i * 3 + j * 7) * (i + j + 1)) % 100;
            matrix[i][j] = value < 50 ? 1 : 0; // 50% 的概率生成点
        }
    }

    // 绘制点阵，添加圆角效果
    ctx.fillStyle = pixelColor;
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // 对称绘制
            const value = j < Math.ceil(size / 2)
                ? matrix[i][j]
                : matrix[i][size - j - 1];

            if (value) {
                const x = j * pixelSize + padding;
                const y = i * pixelSize + padding;
                const radius = pixelSize / 4; // 圆角半径

                // 绘制圆角矩形
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + pixelSize - radius, y);
                ctx.quadraticCurveTo(x + pixelSize, y, x + pixelSize, y + radius);
                ctx.lineTo(x + pixelSize, y + pixelSize - radius);
                ctx.quadraticCurveTo(x + pixelSize, y + pixelSize, x + pixelSize - radius, y + pixelSize);
                ctx.lineTo(x + radius, y + pixelSize);
                ctx.quadraticCurveTo(x, y + pixelSize, x, y + pixelSize - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    // 添加边框效果
    ctx.strokeStyle = backgroundColor;
    ctx.lineWidth = padding / 2;
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - padding / 4, 0, Math.PI * 2);
    ctx.stroke();

    return canvas.toDataURL('image/png');
}

// 生成序列号
export function generateSerialNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${timestamp}${random}`;
}

// 生成初始用户信息
export function generateInitialProfile(): UserProfile {
    // 生成时间戳（毫秒）
    const timestamp = Date.now();
    // 将时间戳转换为36进制并取后6位
    const timeStr = timestamp.toString(36).slice(-6).toUpperCase();
    // 生成随机字符串（4位）
    const randomStr = Math.random().toString(36).slice(2, 6).toUpperCase();
    // 组合成序列号
    const serialNumber = `${timeStr}${randomStr}`;

    return {
        nickname: `Aurora_${serialNumber}`,
        email: '',
        ethereum_address: '',
        ethereum_public_key: '',
        ethereum_private_key: '',
        avatar_url: generatePixelAvatar(serialNumber),
        bio: '欢迎使用 Aurora！',
        is_registered: false,
        chain_type: 'ethereum',
        blockchain_params: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
} 