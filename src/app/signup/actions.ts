"use server";

import { prisma } from "@/lib/db";

export async function cadastrarUsuario(data: {
  nome: string;
  usuario: string;
  senhaStr: string;
}) {
  const nome = data.nome.trim();
  let usuario = data.usuario.trim();
  const senha = data.senhaStr.trim();

  if (!nome || !usuario || !senha) {
    return { success: false, error: "Todos os campos são obrigatórios." };
  }

  // Garante que o usuário comece com o padrão @
  if (!usuario.startsWith("@")) {
    usuario = `@${usuario}`;
  }

  // Verifica se o usuário já existe
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { usuario },
  });

  if (usuarioExistente) {
    return { success: false, error: `O usuário ${usuario} já está cadastrado.` };
  }

  try {
    // Por padrão, novos cadastros entram como CAMPO
    await prisma.usuario.create({
      data: {
        nome,
        usuario,
        senha,
        role: "CAMPO",
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao registrar o usuário no banco de dados." };
  }
}
