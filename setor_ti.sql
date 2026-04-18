-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Tempo de geração: 18/04/2026 às 04:10
-- Versão do servidor: 8.4.7
-- Versão do PHP: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `setor_ti`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `atividades`
--

DROP TABLE IF EXISTS `atividades`;
CREATE TABLE IF NOT EXISTS `atividades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `acao` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalhes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_atividade` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_atividades_tipo` (`tipo`),
  KEY `idx_atividades_data` (`data_atividade`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `configuracoes`
--

DROP TABLE IF EXISTS `configuracoes`;
CREATE TABLE IF NOT EXISTS `configuracoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chave` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` text COLLATE utf8mb4_unicode_ci,
  `data_atualizacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chave` (`chave`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `configuracoes`
--

INSERT INTO `configuracoes` (`id`, `chave`, `valor`, `data_atualizacao`) VALUES
(1, 'tema', 'dark', '2026-04-16 00:39:40'),
(2, 'versao', '1.0.0', '2026-04-16 00:39:40');

--
-- Acionadores `configuracoes`
--
DROP TRIGGER IF EXISTS `update_configuracoes_timestamp`;
DELIMITER $$
CREATE TRIGGER `update_configuracoes_timestamp` BEFORE UPDATE ON `configuracoes` FOR EACH ROW SET NEW.data_atualizacao = CURRENT_TIMESTAMP
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura stand-in para view `dashboard_resumo`
-- (Veja abaixo para a visão atual)
--
DROP VIEW IF EXISTS `dashboard_resumo`;
CREATE TABLE IF NOT EXISTS `dashboard_resumo` (
`itens_estoque_baixo` bigint
,`servicos_concluidos` bigint
,`servicos_pendentes` bigint
,`total_itens_estoque` bigint
,`total_snippets` bigint
);

-- --------------------------------------------------------

--
-- Estrutura para tabela `estoque_itens`
--

DROP TABLE IF EXISTS `estoque_itens`;
CREATE TABLE IF NOT EXISTS `estoque_itens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade` int NOT NULL DEFAULT '0',
  `estoque_minimo` int DEFAULT '5',
  `localizacao` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) DEFAULT '1',
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_estoque_categoria` (`categoria`),
  KEY `idx_estoque_ativo` (`ativo`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `estoque_itens`
--

INSERT INTO `estoque_itens` (`id`, `nome`, `categoria`, `quantidade`, `estoque_minimo`, `localizacao`, `descricao`, `ativo`, `data_criacao`, `data_atualizacao`) VALUES
(1, 'Mouse USB Logitech', 'perifericos', 15, 5, 'Armário A-01', 'Mouse USB com fio, DPI ajustável', 1, '2026-04-16 00:39:40', '2026-04-16 00:39:40'),
(2, 'Teclado ABNT2', 'perifericos', 8, 5, 'Armário A-02', 'Teclado padrão brasileiro com fio', 1, '2026-04-16 00:39:40', '2026-04-16 00:39:40'),
(3, 'Cabo de Rede CAT6 5m', 'cabos', 25, 10, 'Prateleira B-01', 'Cabo de rede azul 5 metros', 1, '2026-04-16 00:39:40', '2026-04-16 00:39:40'),
(4, 'Memória RAM 8GB DDR4', 'hardware', 3, 5, 'Gaveta C-01', 'Memória RAM 8GB 3200MHz', 1, '2026-04-16 00:39:40', '2026-04-16 00:39:40');

--
-- Acionadores `estoque_itens`
--
DROP TRIGGER IF EXISTS `update_estoque_itens_timestamp`;
DELIMITER $$
CREATE TRIGGER `update_estoque_itens_timestamp` BEFORE UPDATE ON `estoque_itens` FOR EACH ROW SET NEW.data_atualizacao = CURRENT_TIMESTAMP
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `servicos`
--

DROP TABLE IF EXISTS `servicos`;
CREATE TABLE IF NOT EXISTS `servicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cliente_setor` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prioridade` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'media',
  `data_servico` date DEFAULT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `relatorio` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_conclusao` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_servicos_status` (`status`),
  KEY `idx_servicos_prioridade` (`prioridade`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `servicos`
--

INSERT INTO `servicos` (`id`, `titulo`, `cliente_setor`, `prioridade`, `data_servico`, `descricao`, `relatorio`, `status`, `data_criacao`, `data_atualizacao`, `data_conclusao`) VALUES
(1, 'Manutenção Preventiva - PC Financeiro', 'Setor Financeiro', 'media', NULL, 'Realizar manutenção preventiva no computador do setor financeiro, incluindo limpeza física e lógica.', 'Limpeza física realizada com sucesso. Troca de pasta térmica. Sistema operacional atualizado. Backup realizado.', 'completed', '2026-04-16 00:39:40', '2026-04-16 00:39:40', NULL),
(2, 'Instalação de Impressora de Rede', 'Recursos Humanos', 'alta', NULL, 'Instalar e configurar impressora de rede no setor de RH.', '', 'pending', '2026-04-16 00:39:40', '2026-04-16 00:39:40', NULL);

--
-- Acionadores `servicos`
--
DROP TRIGGER IF EXISTS `update_servicos_timestamp`;
DELIMITER $$
CREATE TRIGGER `update_servicos_timestamp` BEFORE UPDATE ON `servicos` FOR EACH ROW SET NEW.data_atualizacao = CURRENT_TIMESTAMP
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `snippets`
--

DROP TABLE IF EXISTS `snippets`;
CREATE TABLE IF NOT EXISTS `snippets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titulo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `codigo` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_snippets_categoria` (`categoria`),
  KEY `idx_snippets_tipo` (`tipo`),
  KEY `idx_snippets_ativo` (`ativo`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `snippets`
--

INSERT INTO `snippets` (`id`, `titulo`, `categoria`, `tipo`, `tags`, `descricao`, `codigo`, `ativo`, `data_criacao`, `data_atualizacao`) VALUES
(1, 'Limpar Cache DNS', 'rede', 'cmd', 'dns, cache, rede', 'Limpa o cache de DNS do Windows', 'ipconfig /flushdns', 1, '2026-04-16 00:39:40', '2026-04-16 00:39:40'),
(2, 'Verificar Integridade do Sistema', 'sistema', 'cmd', 'sistema, reparo, sfc', 'Verifica e repara arquivos do sistema Windows', 'sfc /scannow', 1, '2026-04-16 00:39:40', '2026-04-16 00:39:40'),
(3, 'Listar Processos', 'sistema', 'powershell', 'processos, sistema', 'Lista processos em execução ordenados por memória', 'Get-Process | Sort-Object WS -Descending | Select-Object -First 10 Name, Id, WS, CPU', 1, '2026-04-16 00:39:40', '2026-04-16 00:39:40'),
(4, 'Resetar Configurações de Rede', 'rede', 'batch', 'rede, reset, tcp', 'Script para resetar configurações de rede', '@echo off\r\nipconfig /release\r\nipconfig /renew\r\nipconfig /flushdns\r\nnetsh winsock reset\r\nnetsh int ip reset\r\necho Concluido!\r\npause', 1, '2026-04-16 00:39:40', '2026-04-16 00:39:40');

--
-- Acionadores `snippets`
--
DROP TRIGGER IF EXISTS `update_snippets_timestamp`;
DELIMITER $$
CREATE TRIGGER `update_snippets_timestamp` BEFORE UPDATE ON `snippets` FOR EACH ROW SET NEW.data_atualizacao = CURRENT_TIMESTAMP
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome_completo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT '1',
  `data_criacao` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `usuario`, `senha`, `nome_completo`, `email`, `ativo`, `data_criacao`, `data_atualizacao`) VALUES
(1, 'Admin', 'Administracao@1', 'Administrador do Sistema', 'admin@setorti.gov.br', 1, '2026-04-16 00:39:40', '2026-04-16 00:39:40');

-- --------------------------------------------------------

--
-- Estrutura para view `dashboard_resumo`
--
DROP TABLE IF EXISTS `dashboard_resumo`;

DROP VIEW IF EXISTS `dashboard_resumo`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `dashboard_resumo`  AS SELECT (select count(0) from `estoque_itens` where (`estoque_itens`.`ativo` = true)) AS `total_itens_estoque`, (select count(0) from `estoque_itens` where ((`estoque_itens`.`ativo` = true) and (`estoque_itens`.`quantidade` <= `estoque_itens`.`estoque_minimo`))) AS `itens_estoque_baixo`, (select count(0) from `snippets` where (`snippets`.`ativo` = true)) AS `total_snippets`, (select count(0) from `servicos` where (`servicos`.`status` = 'pending')) AS `servicos_pendentes`, (select count(0) from `servicos` where (`servicos`.`status` = 'completed')) AS `servicos_concluidos` ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
