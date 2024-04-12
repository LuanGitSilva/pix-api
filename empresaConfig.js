import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getConfigById = async () => {
  try {
    return await prisma.tenant.findMany();
  } catch (error) {
    console.error('Erro ao obter configurações das empresas:', error);
    throw error;
  }
}

export default {
  getConfigById
};