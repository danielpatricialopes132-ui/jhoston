SELECT id, email, nome, role, senha FROM "Usuario" WHERE role = 'MASTER' OR nome = 'MASTER' OR email LIKE '%master%';
