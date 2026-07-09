"use server";

import { prisma } from "@/lib/db";

export async function solicitarResetSenha(usuarioInput: string) {
  let usuario = usuarioInput.trim();
  if (!usuario) {
    return { success: false, error: "Usuário é obrigatório." };
  }

  if (!usuario.startsWith("@")) {
    usuario = `@${usuario}`;
  }

  if (usuario === "@master") {
    return { success: false, error: "A conta @master não pode ser resetada por este canal." };
  }

  const user = await prisma.usuario.findUnique({
    where: { usuario },
  });

  if (!user) {
    return { success: false, error: "Usuário não cadastrado no sistema." };
  }

  await prisma.usuario.update({
    where: { usuario },
    data: {
      statusReset: "SOLICITADO",
    },
  });

  return { success: true };
}

export async function verificarStatusReset(usuarioInput: string) {
  let usuario = usuarioInput.trim();
  if (!usuario) return { authorized: false };

  if (!usuario.startsWith("@")) {
    usuario = `@${usuario}`;
  }

  const user = await prisma.usuario.findUnique({
    where: { usuario },
  });

  return {
    authorized: user?.statusReset === "AUTORIZADO",
    userName: user?.nome || "",
  };
}

export async function definirNovaSenha(usuarioInput: string, novaSenhaStr: string) {
  let usuario = usuarioInput.trim();
  const novaSenha = novaSenhaStr.trim();

  if (!usuario || !novaSenha) {
    return { success: false, error: "Usuário e nova senha são obrigatórios." };
  }

  if (!usuario.startsWith("@")) {
    usuario = `@${usuario}`;
  }

  const user = await prisma.usuario.findUnique({
    where: { usuario },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }

  if (user.statusReset !== "AUTORIZADO") {
    return { success: false, error: "O reset deste usuário não foi autorizada pelo MASTER ainda." };
  }

  await prisma.usuario.update({
    where: { usuario },
    data: {
      senha: novaSenha,
      statusReset: "NENHUM",
      role: "CAMPO", // Restringe a CAMPO até nova liberação
    },
  });

  return { success: true };
}
