/**
 * Generates a SHA-256 hash of the input string
 * @param input The string to hash
 * @returns Promise<string> The hexadecimal hash string
 */
export const sha256 = async (input: string): Promise<string> => {
    try {
        // Convert the input string to a Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(input);

        // Generate the hash
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);

        // Convert the hash buffer to a hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex;
    } catch (error) {
        console.error('Error generating SHA-256 hash:', error);
        throw error;
    }
}; 