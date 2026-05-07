import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getDashboard } from '../services/api';
import './DashboardPage.css';

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className={`stat-card ${accent}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

const tipoLabel = { SIMPLES: 'Simples', DUPLO: 'Duplo', SUITE: 'Suíte' };
const tipoMovLabel = { ENTRADA: 'Check-in', SAIDA: 'Check-out' };

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const alert = data?.overbooking
    ? { type: 'danger', icon: '🚨', message: 'OVERBOOKING: Hotel em capacidade máxima!' }
    : data?.alertaOverbooking
    ? { type: 'warning', icon: '⚠️', message: `Atenção: apenas ${data.resumo.quartosDisponiveis} quarto(s) disponível(is). Próximo do limite de overbooking!` }
    : null;

  return (
    <Layout title="Dashboard" alert={alert}>
      {loading ? (
        <div className="loading-state">Carregando dados...</div>
      ) : (
        <div className="dashboard animate-fade">
          <div className="stats-grid">
            <StatCard icon="⊞" label="Total de Quartos" value={data?.resumo.totalQuartos} accent="gold" />
            <StatCard icon="●" label="Quartos Ocupados" value={data?.resumo.quartosOcupados} sub={`${data?.resumo.taxaOcupacao}% de ocupação`} accent="danger" />
            <StatCard icon="○" label="Quartos Disponíveis" value={data?.resumo.quartosDisponiveis} accent="success" />
            <StatCard icon="%" label="Taxa de Ocupação" value={`${data?.resumo.taxaOcupacao}%`} accent="info" />
          </div>

          <div className="dash-grid">
            <div className="dash-card">
              <h3>Distribuição por Tipo</h3>
              <div className="gold-line" />
              <div className="tipo-list">
                {data?.porTipo.map(t => (
                  <div key={t.tipo} className="tipo-row">
                    <span className={`badge badge-${t.tipo.toLowerCase()}`}>{tipoLabel[t.tipo]}</span>
                    <div className="tipo-bar-wrap">
                      <div
                        className="tipo-bar"
                        style={{ width: `${(t._count / data.resumo.totalTodos) * 100}%` }}
                      />
                    </div>
                    <span className="tipo-count">{t._count} quarto{t._count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-card">
              <h3>Movimentações Recentes</h3>
              <div className="gold-line" />
              <div className="mov-list">
                {data?.movimentacoesRecentes.length === 0 && (
                  <p className="empty-text">Nenhuma movimentação registrada</p>
                )}
                {data?.movimentacoesRecentes.map(m => (
                  <div key={m.id} className="mov-item">
                    <span className={`mov-type ${m.tipo.toLowerCase()}`}>
                      {m.tipo === 'ENTRADA' ? '▲' : '▼'} {tipoMovLabel[m.tipo]}
                    </span>
                    <div className="mov-info">
                      <span>Quarto {m.quarto.numero} ({tipoLabel[m.quarto.tipo]})</span>
                      <span className="mov-meta">por {m.usuario.nome} · {new Date(m.dataMovimentacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
