"use server";
import { env } from 'process';
const EVOLUTION_API_URL = 'https://whatsapp-ecostone.onrender.com';
const EVOLUTION_API_KEY = 'Gabriel2006!';
const INSTANCE_NAME = 'ecostone'; // O nome da instância que criamos

interface SendTextOptions {
  number: string;
  text: string;
  delay?: number;
}

interface SendFileOptions {
  number: string;
  base64: string;
  fileName: string;
  caption?: string;
  mimetype?: string;
  delay?: number;
}

/**
 * Formata o número para o padrão esperado pela API (55 + DDD + Número)
 */
function formatNumber(number: string): string {
  // Se for um JID de grupo, retorna do jeito que está (Evolution API v2)
  if (number.includes('@g.us') || number.includes('-')) {
    return number;
  }

  // Remove tudo que não for número
  const clean = number.replace(/\D/g, '');
  
  // Se já começar com 55 e tiver tamanho adequado, mantém
  if (clean.startsWith('55') && clean.length >= 12) {
    return clean;
  }
  
  // Se não tem 55 mas tem DDD + Número, adiciona 55
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  
  return clean;
}

/**
 * "Acorda" o servidor Render e verifica se a instância está pronta e conectada.
 * Não obriga a esperar 60s se o servidor responder antes! Faz polling inteligente.
 */
export async function wakeEvolutionServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${EVOLUTION_API_URL}`, {
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeoutId);
    return res?.ok || false;
  } catch {
    return false;
  }
}

/**
 * Garante que a instância do WhatsApp no Render está acordada e com status "open".
 * Se estiver dormindo ou conectando, faz tentativas inteligentes (polling) até 50 segundos.
 */
async function ensureEvolutionConnected(maxWaitSeconds = 50): Promise<void> {
  const startTime = Date.now();
  
  // 1. Disparo de "Wake-up" rápido na raiz
  fetch(`${EVOLUTION_API_URL}`).catch(() => {});

  while (Date.now() - startTime < maxWaitSeconds * 1000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`, {
        headers: { 'apikey': EVOLUTION_API_KEY },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const state = data?.instance?.state;
        if (state === 'open') {
          console.log(`[Evolution API] Conectado e pronto em ${Math.round((Date.now() - startTime) / 1000)}s.`);
          return;
        }
        console.log(`[Evolution API] Instância em estado '${state}', aguardando...`);
      }
    } catch (e: any) {
      console.log(`[Evolution API] Servidor acordando (${Math.round((Date.now() - startTime) / 1000)}s)...`);
    }

    // Espera 3 segundos antes da próxima checagem
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.warn(`[Evolution API] Tempo limite de espera atingido (${maxWaitSeconds}s). Tentando envio direto.`);
}
export async function sendWhatsAppText({ number, text, delay = 1200 }: SendTextOptions) {
  try {
    const formattedNumber = formatNumber(number);

    // Assegura que o servidor está acordado e pronto
    await ensureEvolutionConnected();
    
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: formattedNumber,
        options: {
          delay: delay,
          presence: 'composing',
          linkPreview: false
        },
        text: text
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('Erro detalhado na API Evolution (Text):', response.status, errorData);
      const msg = errorData?.response?.message || errorData?.message || response.statusText;
      throw new Error(`Falha ao enviar mensagem (${response.status}): ${typeof msg === 'object' ? JSON.stringify(msg) : msg}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro em sendWhatsAppText:', error);
    throw error;
  }
}

/**
 * Envia um arquivo (PDF, Imagem, etc) em base64 via WhatsApp
 */
export async function sendWhatsAppFile({ number, base64, fileName, caption = '', mimetype = 'application/pdf', delay = 1500 }: SendFileOptions) {
  try {
    const formattedNumber = formatNumber(number);

    // 1. Assegura que o servidor no Render está acordado e com WhatsApp conectado antes de enviar
    await ensureEvolutionConnected();
    
    // Assegura que o base64 está no formato correto exigido pela Evolution API v2 (data URI scheme ou base64 puro)
    // Para v2, enviamos o base64 puro sem o prefixo (data:mimetype;base64,) se for o campo document
    let cleanBase64 = base64;
    if (base64.includes('base64,')) {
      cleanBase64 = base64.split('base64,')[1];
    }
    
    const response = await fetch(`${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number: formattedNumber,
        options: {
          delay: delay,
          presence: 'composing'
        },
        mediatype: 'document',
        mimetype: mimetype,
        caption: caption,
        media: cleanBase64,
        fileName: fileName
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('Erro detalhado na API Evolution (File):', response.status, errorData);
      const msg = errorData?.response?.message || errorData?.message || response.statusText;
      throw new Error(`Falha ao enviar arquivo (${response.status}): ${typeof msg === 'object' ? JSON.stringify(msg) : msg}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro em sendWhatsAppFile:', error);
    throw error;
  }
}

/**
 * Cria um grupo no WhatsApp via Evolution API
 * Retorna o ID do grupo (ex: 120363123456789@g.us)
 */
export async function createWhatsAppGroup(subject: string, participants: string[]) {
  try {
    const formattedParticipants = participants.map(formatNumber);

    const response = await fetch(`${EVOLUTION_API_URL}/group/create/${INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        subject: subject,
        description: 'Grupo criado via Sistema ',
        participants: formattedParticipants
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na API Evolution (Create Group):', errorData);
      throw new Error(`Falha ao criar grupo: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro em createWhatsAppGroup:', error);
    throw error;
  }
}

