import crypto from 'crypto';

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'uma-chave-secreta-muito-segura-e-longa-para-aes-256-123456789012';
// AES-256 requires a 32-byte key
const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);

export function encryptToken(payload: any): string {
  const text = JSON.stringify(payload);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Formato: iv:encrypted
  const token = `${iv.toString('hex')}:${encrypted}`;
  // Codificar em base64url para usar na URL de forma segura
  return Buffer.from(token).toString('base64url');
}

export function decryptToken(base64Token: string): any | null {
  try {
    const token = Buffer.from(base64Token, 'base64url').toString('utf8');
    const [ivHex, encrypted] = token.split(':');
    if (!ivHex || !encrypted) return null;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Erro ao descriptografar token:", error);
    return null;
  }
}
