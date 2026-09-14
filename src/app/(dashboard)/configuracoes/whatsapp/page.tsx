"use client";

import { useState, useEffect } from "react";
import { getEvolutionConnectionState, connectEvolutionInstance, logoutEvolutionInstance } from "@/lib/whatsapp";
import { Loader2, QrCode, Smartphone, LogOut } from "lucide-react";
import Image from "next/image";

export default function WhatsAppConfigPage() {
  const [state, setState] = useState<'open' | 'connecting' | 'close' | 'loading'>('loading');
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  // Poll de status a cada 5 segundos se estiver conectando
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (state === 'connecting') {
      interval = setInterval(() => {
        checkStatus();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [state]);

  const checkStatus = async () => {
    try {
      const res = await getEvolutionConnectionState();
      if (res.state === 'open' || res.state === 'close') {
        setState(res.state as any);
        setQrCode(null); // Limpa o QR Code se fechou ou conectou
      }
    } catch (error) {
      console.error("Erro ao checar status:", error);
    }
  };

  const handleConnect = async () => {
    setState('loading');
    try {
      const res = await connectEvolutionInstance();
      if (res?.base64) {
        setQrCode(res.base64);
        setState('connecting');
      } else {
        // Se não veio base64, talvez já tenha conectado muito rápido ou falhado
        checkStatus();
      }
    } catch (error) {
      console.error("Erro ao conectar:", error);
      setState('close');
    }
  };

  const handleLogout = async () => {
    if (!confirm("Tem certeza que deseja desconectar este WhatsApp?")) return;
    
    setState('loading');
    try {
      await logoutEvolutionInstance();
      setState('close');
      setQrCode(null);
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      checkStatus();
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">WhatsApp / Evolution API</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Gerencie a conexão do seu WhatsApp com o sistema.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            <Smartphone className="w-5 h-5" />
            Status da Conexão
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Conecte seu WhatsApp para enviar notificações, cobranças e usar o chatbot.
          </p>
        </div>
        
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          
          {state === 'loading' && (
            <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="font-medium">Verificando status...</p>
            </div>
          )}

          {state === 'open' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-2">
                <Smartphone className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">WhatsApp Conectado!</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Seu sistema já pode enviar e receber mensagens.
                </p>
              </div>
              <button 
                onClick={handleLogout} 
                className="mt-6 flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Desconectar Aparelho
              </button>
            </div>
          )}

          {state === 'close' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                <QrCode className="w-10 h-10 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Desconectado</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Clique no botão abaixo para gerar um QR Code e vincular seu aparelho.
                </p>
              </div>
              <button 
                onClick={handleConnect} 
                className="mt-6 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Gerar QR Code
              </button>
            </div>
          )}

          {state === 'connecting' && qrCode && (
            <div className="flex flex-col items-center gap-4 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Escaneie o QR Code</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie o código abaixo.
              </p>
              <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100 mt-4">
                <Image 
                  src={qrCode.includes('base64') ? qrCode : `data:image/png;base64,${qrCode}`} 
                  alt="QR Code WhatsApp" 
                  width={256} 
                  height={256} 
                  className="rounded"
                />
              </div>
              <div className="flex items-center gap-2 mt-4 font-medium text-blue-600 dark:text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                Aguardando leitura...
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
