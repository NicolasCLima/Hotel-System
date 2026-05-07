const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar usuário admin
  const senhaHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@hotel.com' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@hotel.com',
      senha: senhaHash,
    },
  });
  console.log('✅ Usuário admin criado:', admin.email);

  // Criar quartos
  const quartos = [
    { numero: '101', tipo: 'SIMPLES', capacidade: 1, precoPorNoite: 150.00, descricao: 'Quarto simples com cama de solteiro, ar condicionado e TV' },
    { numero: '102', tipo: 'SIMPLES', capacidade: 1, precoPorNoite: 150.00, descricao: 'Quarto simples com vista para o jardim' },
    { numero: '103', tipo: 'SIMPLES', capacidade: 2, precoPorNoite: 180.00, descricao: 'Quarto simples com duas camas de solteiro' },
    { numero: '201', tipo: 'DUPLO', capacidade: 2, precoPorNoite: 280.00, descricao: 'Quarto duplo com cama de casal e varanda' },
    { numero: '202', tipo: 'DUPLO', capacidade: 2, precoPorNoite: 280.00, descricao: 'Quarto duplo com vista para a piscina' },
    { numero: '203', tipo: 'DUPLO', capacidade: 3, precoPorNoite: 320.00, descricao: 'Quarto duplo com cama extra' },
    { numero: '301', tipo: 'SUITE', capacidade: 2, precoPorNoite: 550.00, descricao: 'Suíte luxuosa com jacuzzi e sala de estar' },
    { numero: '302', tipo: 'SUITE', capacidade: 4, precoPorNoite: 750.00, descricao: 'Suíte presidencial com duas suítes e cozinha' },
  ];

  for (const quarto of quartos) {
    await prisma.quarto.upsert({
      where: { numero: quarto.numero },
      update: {},
      create: quarto,
    });
  }
  console.log(`✅ ${quartos.length} quartos criados`);

  // Criar algumas movimentações de exemplo
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  const quartosDB = await prisma.quarto.findMany({ take: 4 });

  await prisma.movimentacao.createMany({
    data: [
      { quartoId: quartosDB[0].id, usuarioId: admin.id, tipo: 'ENTRADA', dataMovimentacao: ontem, observacao: 'Check-in hóspede João Silva' },
      { quartoId: quartosDB[1].id, usuarioId: admin.id, tipo: 'ENTRADA', dataMovimentacao: ontem, observacao: 'Check-in hóspede Maria Souza' },
      { quartoId: quartosDB[2].id, usuarioId: admin.id, tipo: 'ENTRADA', dataMovimentacao: hoje, observacao: 'Check-in hóspede Carlos Lima' },
      { quartoId: quartosDB[0].id, usuarioId: admin.id, tipo: 'SAIDA', dataMovimentacao: hoje, observacao: 'Check-out hóspede João Silva' },
    ],
  });
  console.log('✅ Movimentações de exemplo criadas');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
