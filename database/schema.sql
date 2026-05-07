
CREATE DATABASE IF NOT EXISTS hotel_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hotel_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  senha      VARCHAR(255)  NOT NULL,
  createdAt  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quartos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  numero         VARCHAR(10)  NOT NULL UNIQUE,
  tipo           ENUM('SIMPLES','DUPLO','SUITE') NOT NULL,
  capacidade     INT          NOT NULL,
  precoPorNoite  DECIMAL(10,2) NOT NULL,
  descricao      TEXT,
  ativo          TINYINT(1)   NOT NULL DEFAULT 1,
  createdAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_quartos_numero (numero),
  INDEX idx_quartos_tipo   (tipo),
  INDEX idx_quartos_ativo  (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS movimentacoes (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  quartoId         INT         NOT NULL,
  usuarioId        INT         NOT NULL,
  tipo             ENUM('ENTRADA','SAIDA') NOT NULL,
  dataMovimentacao DATETIME(3) NOT NULL,
  observacao       TEXT,
  createdAt        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_mov_quarto  FOREIGN KEY (quartoId)   REFERENCES quartos(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_mov_usuario FOREIGN KEY (usuarioId)  REFERENCES usuarios(id)  ON DELETE RESTRICT,
  INDEX idx_mov_quarto   (quartoId),
  INDEX idx_mov_usuario  (usuarioId),
  INDEX idx_mov_tipo     (tipo),
  INDEX idx_mov_data     (dataMovimentacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT INTO usuarios (nome, email, senha) VALUES
  ('Administrador', 'admin@hotel.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh6i'),
  ('Recepcionista', 'recepcao@hotel.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh6i')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);


INSERT INTO quartos (numero, tipo, capacidade, precoPorNoite, descricao) VALUES
  ('101', 'SIMPLES', 1, 150.00, 'Quarto simples com cama de solteiro, ar condicionado e TV'),
  ('102', 'SIMPLES', 1, 150.00, 'Quarto simples com vista para o jardim'),
  ('103', 'SIMPLES', 2, 180.00, 'Quarto simples com duas camas de solteiro'),
  ('104', 'SIMPLES', 1, 160.00, 'Quarto simples com banheira e frigobar'),
  ('201', 'DUPLO',   2, 280.00, 'Quarto duplo com cama de casal e varanda'),
  ('202', 'DUPLO',   2, 280.00, 'Quarto duplo com vista para a piscina'),
  ('203', 'DUPLO',   3, 320.00, 'Quarto duplo com cama extra para terceiro'),
  ('204', 'DUPLO',   2, 300.00, 'Quarto duplo com banheiro de hidromassagem'),
  ('301', 'SUITE',   2, 550.00, 'Suíte luxuosa com jacuzzi e sala de estar'),
  ('302', 'SUITE',   4, 750.00, 'Suíte presidencial com duas suítes e cozinha')
ON DUPLICATE KEY UPDATE precoPorNoite = VALUES(precoPorNoite);


INSERT INTO movimentacoes (quartoId, usuarioId, tipo, dataMovimentacao, observacao)
SELECT q.id, u.id, 'ENTRADA', DATE_SUB(NOW(), INTERVAL 2 DAY), 'Check-in João da Silva'
  FROM quartos q, usuarios u WHERE q.numero = '101' AND u.email = 'admin@hotel.com' LIMIT 1;

INSERT INTO movimentacoes (quartoId, usuarioId, tipo, dataMovimentacao, observacao)
SELECT q.id, u.id, 'ENTRADA', DATE_SUB(NOW(), INTERVAL 1 DAY), 'Check-in Maria Oliveira'
  FROM quartos q, usuarios u WHERE q.numero = '201' AND u.email = 'admin@hotel.com' LIMIT 1;

INSERT INTO movimentacoes (quartoId, usuarioId, tipo, dataMovimentacao, observacao)
SELECT q.id, u.id, 'ENTRADA', NOW(), 'Check-in Carlos Lima'
  FROM quartos q, usuarios u WHERE q.numero = '301' AND u.email = 'recepcao@hotel.com' LIMIT 1;


SELECT 'Usuarios:' AS tabela, COUNT(*) AS total FROM usuarios
UNION ALL
SELECT 'Quartos:', COUNT(*) FROM quartos
UNION ALL
SELECT 'Movimentacoes:', COUNT(*) FROM movimentacoes;
