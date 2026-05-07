const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard
router.get('/', authMiddleware, async (req, res) => {
  try {
    const totalQuartos = await prisma.quarto.count({ where: { ativo: true } });
    const totalTodos = await prisma.quarto.count();

    const quartos = await prisma.quarto.findMany({
      where: { ativo: true },
      include: {
        movimentacoes: {
          orderBy: { dataMovimentacao: 'desc' },
          take: 1,
        },
      },
    });

    const quartosOcupados = quartos.filter(
      (q) => q.movimentacoes[0]?.tipo === 'ENTRADA'
    ).length;

    const quartosDisponiveis = totalQuartos - quartosOcupados;
    const taxaOcupacao = totalQuartos > 0 ? Math.round((quartosOcupados / totalQuartos) * 100) : 0;

    // Movimentações recentes
    const movimentacoesRecentes = await prisma.movimentacao.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        quarto: { select: { numero: true, tipo: true } },
        usuario: { select: { nome: true } },
      },
    });

    // Contagem por tipo
    const porTipo = await prisma.quarto.groupBy({
      by: ['tipo'],
      _count: true,
      where: { ativo: true },
    });

    res.json({
      resumo: {
        totalQuartos,
        totalTodos,
        quartosOcupados,
        quartosDisponiveis,
        taxaOcupacao,
      },
      porTipo,
      movimentacoesRecentes,
      alertaOverbooking: quartosDisponiveis <= (parseInt(process.env.OVERBOOKING_THRESHOLD) || 2),
      overbooking: quartosDisponiveis <= 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar dashboard', details: err.message });
  }
});

module.exports = router;
