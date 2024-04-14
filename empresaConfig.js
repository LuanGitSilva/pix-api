const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getConfigById = async () => {
  try {
    return await prisma.tenant.findMany({
      where: {
        chavePix
      }
    });
  } catch (error) {
    console.error('Erro ao obter configurações das empresas:', error);
    throw error;
  }
}

module.exports = {
  getConfigById
};