const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

const OVERBOOKING_THRESHOLD = parseInt(process.env.OVERBOOKING_THRESHOLD) || 2;

async function verificarDisponibilidade() {
  const totalQuartos = await prisma.quarto.count({ where: { ativo: true } });

  // Contar quartos ocupados (última movimentação é ENTRADA)
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
  const alertaOverbooking = quartosDisponiveis <= OVERBOOKING_THRESHOLD;
  const overbooking = quartosDisponiveis <= 0;

  return {
    totalQuartos,
    quartosOcupados,
    quartosDisponiveis,
    alertaOverbooking,
    overbooking,
    threshold: OVERBOOKING_THRESHOLD,
  };
}

// GET /api/reservas - Listar movimentações com quartos ordenados alfabeticamente
router.get('/', authMiddleware, async (req, res) => {
  try {
    const quartos = await prisma.quarto.findMany({
      where: { ativo: true },
      orderBy: { numero: 'asc' },
      include: {
        movimentacoes: {
          orderBy: { dataMovimentacao: 'desc' },
          take: 1,
          include: { usuario: { select: { nome: true } } },
        },
      },
    });

    const disponibilidade = await verificarDisponibilidade();

    const quartosComStatus = quartos.map((q) => {
      const ultima = q.movimentacoes[0];
      return {
        id: q.id,
        numero: q.numero,
        tipo: q.tipo,
        capacidade: q.capacidade,
        precoPorNoite: q.precoPorNoite,
        ocupado: ultima?.tipo === 'ENTRADA',
        ultimaMovimentacao: ultima || null,
      };
    });

    res.json({ quartos: quartosComStatus, disponibilidade });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar reservas', details: err.message });
  }
});

// GET /api/reservas/historico - Histórico completo
router.get('/historico', authMiddleware, async (req, res) => {
  try {
    const movimentacoes = await prisma.movimentacao.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        quarto: { select: { numero: true, tipo: true } },
        usuario: { select: { nome: true, email: true } },
      },
    });

    res.json(movimentacoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico', details: err.message });
  }
});

// GET /api/reservas/disponibilidade
router.get('/disponibilidade', authMiddleware, async (req, res) => {
  try {
    const disponibilidade = await verificarDisponibilidade();
    res.json(disponibilidade);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao verificar disponibilidade' });
  }
});

// POST /api/reservas/movimentar - Registrar entrada ou saída
router.post('/movimentar', authMiddleware, async (req, res) => {
  const { quartoId, tipo, dataMovimentacao, observacao } = req.body;

  if (!quartoId || !tipo || !dataMovimentacao) {
    return res.status(400).json({ error: 'Quarto, tipo e data são obrigatórios' });
  }

  if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo deve ser ENTRADA ou SAIDA' });
  }

  try {
    const quarto = await prisma.quarto.findUnique({ where: { id: parseInt(quartoId) } });
    if (!quarto) return res.status(404).json({ error: 'Quarto não encontrado' });
    if (!quarto.ativo) return res.status(400).json({ error: 'Quarto inativo' });

    // Verificar estado atual do quarto
    const ultimaMovimentacao = await prisma.movimentacao.findFirst({
      where: { quartoId: parseInt(quartoId) },
      orderBy: { dataMovimentacao: 'desc' },
    });

    const quartoOcupado = ultimaMovimentacao?.tipo === 'ENTRADA';

    if (tipo === 'ENTRADA' && quartoOcupado) {
      return res.status(409).json({ error: 'Quarto já está ocupado. Registre uma saída primeiro.' });
    }

    if (tipo === 'SAIDA' && !quartoOcupado) {
      return res.status(409).json({ error: 'Quarto já está disponível. Não há hóspede para dar saída.' });
    }

    // Registrar movimentação
    const movimentacao = await prisma.movimentacao.create({
      data: {
        quartoId: parseInt(quartoId),
        usuarioId: req.user.id,
        tipo,
        dataMovimentacao: new Date(dataMovimentacao),
        observacao,
      },
      include: {
        quarto: { select: { numero: true, tipo: true } },
        usuario: { select: { nome: true } },
      },
    });

    // Verificar disponibilidade após movimentação
    const disponibilidade = await verificarDisponibilidade();

    res.status(201).json({
      movimentacao,
      disponibilidade,
      alerta: disponibilidade.alertaOverbooking
        ? disponibilidade.overbooking
          ? '🚨 ATENÇÃO: Hotel em capacidade máxima (overbooking)!'
          : `⚠️ ATENÇÃO: Apenas ${disponibilidade.quartosDisponiveis} quarto(s) disponível(is). Próximo do limite de overbooking!`
        : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar movimentação', details: err.message });
  }
});

module.exports = router;
