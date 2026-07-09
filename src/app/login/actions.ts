"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function seedUsers() {
  // Verifica se já existe o usuário master
  const masterCount = await prisma.usuario.count({
    where: { usuario: "@master" },
  });

  if (masterCount === 0) {
    // Apaga os usuários admin/campo antigos sem o prefixo @ para evitar resquícios fora do padrão
    await prisma.usuario.deleteMany({
      where: {
        usuario: {
          in: ["admin", "campo"],
        },
      },
    });

    // Cria as novas credenciais no padrão do sistema
    await prisma.usuario.createMany({
      data: [
        {
          usuario: "@master",
          senha: "@MASTER123",
          nome: "Administrador Geral (Master)",
          role: "MASTER",
        },
        {
          usuario: "@admin",
          senha: "admin123",
          nome: "Escritório Central",
          role: "ESCRITORIO",
        },
        {
          usuario: "@campo",
          senha: "campo123",
          nome: "Encarregado Campo",
          role: "CAMPO",
        },
      ],
    });
  }
}

export async function login(data: { usuario: string; senhaStr: string }) {
  await seedUsers(); // Garante a existência dos usuários padrões

  let usuario = data.usuario.trim();
  const senha = data.senhaStr.trim();

  if (!usuario || !senha) {
    return { success: false, error: "Usuário e senha são obrigatórios." };
  }

  // Prepara o usuário forçando a formatação com o @ se o usuário esquecer
  if (!usuario.startsWith("@")) {
    usuario = `@${usuario}`;
  }

  const user = await prisma.usuario.findUnique({
    where: { usuario },
  });

  if (!user || user.senha !== senha) {
    return { success: false, error: "Usuário ou senha incorretos." };
  }

  const cookieStore = await cookies();

  const sessionData = JSON.stringify({
    userId: user.id,
    userName: user.nome,
    userRole: user.role,
  });

  const sessionToken = Buffer.from(sessionData).toString("base64");

  cookieStore.set("session_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: "/",
  });

  return { success: true, role: user.role };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  return { success: true };
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  try {
    const sessionData = Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(sessionData) as {
      userId: number;
      userName: string;
      userRole: "MASTER" | "ESCRITORIO" | "CAMPO";
    };
  } catch {
    return null;
  }
}
