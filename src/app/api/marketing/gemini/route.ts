import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 });
    }

    const body = await req.json();
    const { action, payload } = body;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    let prompt = '';

    switch (action) {
      case 'ANTES_DEPOIS':
        prompt = `
Você é um especialista em marketing digital para empresas de revestimento e montagem de piscinas.
Escreva uma legenda envolvente para o Instagram mostrando o "Antes e Depois" de uma obra.
O tom deve ser inspirador, mostrando a transformação do ambiente.
Use emojis, hashtags relevantes (#piscina #revestimento #arquitetura #antesedepois) e uma chamada para ação (CTA) no final convidando para orçamento.
        `;
        break;

      case 'FEEDBACK':
        prompt = `
Você é o assistente de marketing e qualidade de uma empresa de construção de piscinas.
Recebemos o seguinte feedback de um cliente:
"${payload}"

Sua tarefa é dividida em duas partes, retornadas estritamente no formato JSON:
1. "legenda": Crie uma legenda de Instagram agradecendo ao cliente pela confiança (seja caloroso e ignore reclamações na legenda).
2. "pendencias": Uma lista de strings com os problemas técnicos ou reclamações extraídas do texto (ex: "vazamento", "atraso"). Se não houver, retorne uma lista vazia.

Formato esperado:
{
  "legenda": "Sua legenda de instagram aqui...",
  "pendencias": ["pendencia 1", "pendencia 2"]
}
        `;
        break;

      case 'DIARIO_OBRA':
        prompt = `
Você é o social media de uma construtora de piscinas de alto padrão.
Recebemos as seguintes anotações brutas do diário de obra de hoje:
"${payload}"

Transforme isso em um post de "Por trás das câmeras" (Bastidores) para o Instagram.
A linguagem deve ser acessível para leigos, mostrando o cuidado técnico, a dedicação da equipe e o progresso da obra.
Finalize com uma pergunta para gerar engajamento nos comentários.
        `;
        break;

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    if (action === 'FEEDBACK') {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        const parsed = JSON.parse(text);
        return NextResponse.json(parsed);
      } catch (e) {
        return NextResponse.json({ error: 'Falha ao parsear JSON', text }, { status: 500 });
      }
    }

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
