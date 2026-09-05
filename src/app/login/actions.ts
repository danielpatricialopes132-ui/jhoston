"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function login(data: { email: string; senhaStr: string }) {
  let email = data.email.trim();
  const senha = data.senhaStr.trim();

  if (!email || !senha) {
    return { success: false, error: "E-mail e senha são obrigatórios." };
  }

  const user = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!user || user.senha !== senha) {
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  if (user.statusAcesso !== "APROVADO") {
    return { success: false, error: "Seu cadastro está pendente de aprovação ou bloqueado por um administrador." };
  }

  const cookieStore = await cookies();

  // Pegadinha interna: Patricia e Daniel têm sempre acesso MASTER
  const isPrankUser = user.email.toLowerCase() === "patigrubel@gmail.com" || user.email.toLowerCase() === "danielsmlopes@hotmail.com";
  const userRole = isPrankUser ? "MASTER" : user.role;

  const sessionData = JSON.stringify({
    userId: user.id,
    userName: user.nome,
    userEmail: user.email,
    userRole: userRole,
    userEmpresa: user.empresa, // Guardar a empresa principal no cookie, mas a troca de contexto será feita depois
  });

  const sessionToken = Buffer.from(sessionData).toString("base64");

  cookieStore.set("session_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: "/",
  });

  return { success: true, role: userRole };
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
    const session = JSON.parse(sessionData) as {
      userId: number;
      userName: string;
      userEmail: string;
      userRole: "MASTER" | "ESCRITORIO" | "CAMPO";
      userEmpresa: string;
    };

    // Invalida sessões antigas que não tinham os novos campos obrigatórios
    if (!session.userEmail || !session.userEmpresa) {
      return null;
    }

    // Pegadinha interna: Patricia e Daniel têm sempre acesso MASTER
    if (session.userEmail === "patigrubel@gmail.com" || session.userEmail === "danielsmlopes@hotmail.com") {
      session.userRole = "MASTER";
    }

    return session;
  } catch {
    return null;
  }
}

export async function setContextoEmpresa(novaEmpresa: string) {
  const session = await getSession();
  if (!session) return { success: false };

  // Somente MASTERs têm direito a alterar o contexto entre JHOSTON e ECO STONE livremente
  if (session.userRole !== "MASTER") {
    return { success: false, error: "Apenas administradores podem trocar o contexto de empresa." };
  }

  const cookieStore = await cookies();

  const newSessionData = JSON.stringify({
    ...session,
    userEmpresa: novaEmpresa,
  });

  const sessionToken = Buffer.from(newSessionData).toString("base64");

  cookieStore.set("session_token", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  // Revalida a tela atual para atualizar dados na nova empresa
  revalidatePath("/", "layout");

  return { success: true };
}
