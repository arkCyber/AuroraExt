/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns boolean 是否为有效的邮箱格式
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

/**
 * 验证昵称格式
 * @param nickname 昵称
 * @returns boolean 是否为有效的昵称格式
 */
export const isValidNickname = (nickname: string): boolean => {
    return nickname.length > 0 && nickname.length <= 50;
};

/**
 * 验证个人简介格式
 * @param bio 个人简介
 * @returns boolean 是否为有效的个人简介格式
 */
export const isValidBio = (bio: string): boolean => {
    return bio.length <= 500;
}; 