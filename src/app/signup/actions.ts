"use server";

import { prisma } from "@/lib/db";

export async function cadastrarUsuario(data: {
  nome: string;
  email: string;
  senhaStr: string;
  empresa: string;
  role: string;
}) {
  const nome = data.nome.trim();
  const email = data.email.trim();
  const senha = data.senhaStr.trim();
  const empresa = data.empresa;
  const role = data.role;

  if (!nome || !email || !senha || !empresa || !role) {
    return { success: false, error: "Todos os campos são obrigatórios." };
  }

  // Verifica se o email já existe
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (usuarioExistente) {
    return { success: false, error: `O e-mail ${email} já está cadastrado.` };
  }

  try {
    await prisma.usuario.create({
      data: {
        nome,
        email,
        senha,
        empresa,
        role,
        statusAcesso: "PENDENTE",
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Erro ao registrar o usuário no banco de dados." };
  }
}
