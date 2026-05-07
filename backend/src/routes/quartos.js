const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/quartos - Listar todos os quartos
router.get('/', authMiddleware, async (req, res) => {
  const { busca } = req.query;

  try {
    const where = busca
      ? {
          OR: [
            { numero: { contains: busca } },
            { descricao: { contains: busca } },
            { tipo: { equals: busca.toUpperCase() } },
          ],
        }
      : {};

    const quartos = await prisma.quarto.findMany({
      where,
      orderBy: { numero: 'asc' },
      include: {
        movimentacoes: {
          orderBy: { dataMovimentacao: 'desc' },
          take: 1,
        },
      },
    });

    // Calcular status atual de cada quarto
    const quartosComStatus = quartos.map((q) => {
      const ultimaMovimentacao = q.movimentacoes[0];
      const ocupado =
        ultimaMovimentacao && ultimaMovimentacao.tipo === 'ENTRADA';
      return {
        ...q,
        ocupado,
        ultimaMovimentacao: ultimaMovimentacao || null,
        movimentacoes: undefined,
      };
    });

    res.json(quartosComStatus);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar quartos', details: err.message });
  }
});

// GET /api/quartos/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quarto = await prisma.quarto.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!quarto) return res.status(404).json({ error: 'Quarto não encontrado' });
    res.json(quarto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar quarto' });
  }
});

// POST /api/quartos - Criar quarto
router.post('/', authMiddleware, async (req, res) => {
  const { numero, tipo, capacidade, precoPorNoite, descricao } = req.body;

  if (!numero || !tipo || !capacidade || !precoPorNoite) {
    return res.status(400).json({ error: 'Número, tipo, capacidade e preço são obrigatórios' });
  }

  const tiposValidos = ['SIMPLES', 'DUPLO', 'SUITE'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de quarto inválido. Use: SIMPLES, DUPLO ou SUITE' });
  }

  if (capacidade < 1 || capacidade > 10) {
    return res.status(400).json({ error: 'Capacidade deve ser entre 1 e 10' });
  }

  if (precoPorNoite <= 0) {
    return res.status(400).json({ error: 'Preço deve ser maior que zero' });
  }

  try {
    const existe = await prisma.quarto.findUnique({ where: { numero } });
    if (existe) {
      return res.status(409).json({ error: `Quarto número ${numero} já está cadastrado` });
    }

    const quarto = await prisma.quarto.create({
      data: { numero, tipo, capacidade: parseInt(capacidade), precoPorNoite: parseFloat(precoPorNoite), descricao },
    });

    res.status(201).json(quarto);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar quarto', details: err.message });
  }
});

// PUT /api/quartos/:id - Editar quarto
router.put('/:id', authMiddleware, async (req, res) => {
  const { numero, tipo, capacidade, precoPorNoite, descricao, ativo } = req.body;
  const id = parseInt(req.params.id);

  if (!numero || !tipo || !capacidade || !precoPorNoite) {
    return res.status(400).json({ error: 'Número, tipo, capacidade e preço são obrigatórios' });
  }

  try {
    const existe = await prisma.quarto.findFirst({
      where: { numero, NOT: { id } },
    });
    if (existe) {
      return res.status(409).json({ error: `Número de quarto ${numero} já está em uso` });
    }

    const quarto = await prisma.quarto.update({
      where: { id },
      data: {
        numero,
        tipo,
        capacidade: parseInt(capacidade),
        precoPorNoite: parseFloat(precoPorNoite),
        descricao,
        ativo: ativo !== undefined ? ativo : true,
      },
    });

    res.json(quarto);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Quarto não encontrado' });
    res.status(500).json({ error: 'Erro ao atualizar quarto', details: err.message });
  }
});

// DELETE /api/quartos/:id - Excluir quarto
router.delete('/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Verificar se tem movimentações
    const movimentacoes = await prisma.movimentacao.count({ where: { quartoId: id } });
    if (movimentacoes > 0) {
      return res.status(409).json({
        error: 'Não é possível excluir um quarto com histórico de movimentações. Desative-o em vez disso.',
      });
    }

    await prisma.quarto.delete({ where: { id } });
    res.json({ message: 'Quarto excluído com sucesso' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Quarto não encontrado' });
    res.status(500).json({ error: 'Erro ao excluir quarto', details: err.message });
  }
});

module.exports = router;
