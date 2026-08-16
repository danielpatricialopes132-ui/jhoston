import React from 'react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function BioPage() {
  const links = await prisma.bioLink.findMany({
    where: { ativo: true },
    orderBy: { ordem: 'asc' }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Logo placeholder */}
          <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
            JR
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Jhoston Revestimentos</h1>
          <p className="text-gray-600 mt-2">Especialistas em piscinas e revestimentos de alto padrão.</p>
        </div>

        <div className="flex flex-col gap-4">
          {links.length === 0 ? (
            <p className="text-center text-gray-500">Nenhum link disponível no momento.</p>
          ) : (
            links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 px-6 bg-white shadow-sm hover:shadow-md border border-gray-200 rounded-lg text-center font-medium text-gray-800 transition-all hover:bg-gray-50 hover:scale-[1.02]"
              >
                {link.titulo}
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
