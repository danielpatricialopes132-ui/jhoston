"use server";

import { prisma } from "@/lib/db";

export async function solicitarResetSenha(usuarioInput: string) {
  let email = usuarioInput.trim();
  if (!email) {
    return { success: false, error: "E-mail é obrigatório." };
  }

  const user = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: "E-mail não cadastrado no sistema." };
  }

  await prisma.usuario.update({
    where: { email },
    data: {
      statusReset: "SOLICITADO",
    },
  });

  return { success: true };
}

export async function verificarStatusReset(usuarioInput: string) {
  let email = usuarioInput.trim();
  if (!email) return { authorized: false };

  const user = await prisma.usuario.findUnique({
    where: { email },
  });

  return {
    authorized: user?.statusReset === "AUTORIZADO",
    userName: user?.nome || "",
  };
}

export async function definirNovaSenha(usuarioInput: string, novaSenhaStr: string) {
  let email = usuarioInput.trim();
  const novaSenha = novaSenhaStr.trim();

  if (!email || !novaSenha) {
    return { success: false, error: "E-mail e nova senha são obrigatórios." };
  }

  const user = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }

  if (user.statusReset !== "AUTORIZADO") {
    return { success: false, error: "O reset deste usuário não foi autorizada pelo MASTER ainda." };
  }

  await prisma.usuario.update({
    where: { email },
    data: {
      senha: novaSenha,
      statusReset: "NENHUM",
      role: "CAMPO", // Restringe a CAMPO até nova liberação
    },
  });

  return { success: true };
}
