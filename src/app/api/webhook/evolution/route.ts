import { NextResponse } from 'next/server';
import { sendWhatsAppText } from '@/lib/whatsapp';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from 'process';

// Initialize the Google Generative AI SDK
// Requer a variável de ambiente GEMINI_API_KEY no arquivo .env
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // A Evolution API envia eventos do tipo "MESSAGES_UPSERT" para novas mensagens
    if (body.event !== 'messages.upsert') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    const message = body.data?.message;
    if (!message) {
      return NextResponse.json({ status: 'no_message' }, { status: 200 });
    }

    // Verifica se a mensagem foi enviada pelo próprio bot/instância
    if (message.key?.fromMe) {
      return NextResponse.json({ status: 'ignored_from_me' }, { status: 200 });
    }

    const isGroup = message.key?.remoteJid?.includes('@g.us');
    if (isGroup) {
      return NextResponse.json({ status: 'ignored_group' }, { status: 200 });
    }

    // Extrai o texto da mensagem (pode vir em text, conversation ou extendedTextMessage)
    const messageText = 
      message.message?.conversation || 
      message.message?.extendedTextMessage?.text || 
      "";

    if (!messageText) {
      return NextResponse.json({ status: 'no_text' }, { status: 200 });
    }

    const senderNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
    const senderName = message.pushName || 'Cliente';

    // Se a chave da API não estiver configurada, responde com um aviso
    if (!env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY não configurada no .env");
      await sendWhatsAppText({
        number: senderNumber,
        text: "Desculpe, meu sistema de inteligência artificial está temporariamente offline. Por favor, aguarde o atendimento humano."
      });
      return NextResponse.json({ status: 'api_key_missing' }, { status: 200 });
    }

    // Configuração do Prompt para o Gemini
    const systemInstruction = `
      Você é um assistente virtual de atendimento da JHOSTON TEC.
      Seja sempre educado, claro e prestativo.
      Você está conversando com: ${senderName}.
      Se não souber a resposta, diga gentilmente que irá transferir para um humano.
    `;

    try {
      // Usa o modelo gemini-1.5-flash para respostas rápidas de chat
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemInstruction + "\n\n" + "Mensagem do cliente: " + messageText }] }
        ]
      });

      const responseText = result.response.text();

      // Envia a resposta de volta pelo WhatsApp via Evolution API
      await sendWhatsAppText({
        number: senderNumber,
        text: responseText
      });

      return NextResponse.json({ status: 'success' }, { status: 200 });
    } catch (aiError) {
      console.error("Erro ao gerar resposta com Gemini:", aiError);
      return NextResponse.json({ status: 'ai_error' }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro no webhook evolution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
