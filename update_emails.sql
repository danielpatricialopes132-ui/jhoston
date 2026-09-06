UPDATE "Usuario" SET "email" = 'temp_' || id || '@jhoston.com' WHERE "email" IS NULL;
