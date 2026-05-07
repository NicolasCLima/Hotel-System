import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { getReservas, getHistorico, movimentarReserva } from '../services/api';
import { useToast } from '../context/ToastContext';
import '../components/Modal.css';
import './ReservasPage.css';

const tipoLabel = { SIMPLES: 'Simples', DUPLO: 'Duplo', SUITE: 'Suíte' };
const tipoMovLabel = { ENTRADA: 'Check-in', SAIDA: 'Check-out' };

function OverbookingBanner({ disponibilidade }) {
  if (!disponibilidade) return null;
  const { quartosDisponiveis, alertaOverbooking, overbooking, totalQuartos, quartosOcupados } = disponibilidade;

  return (
    <div className={`overbooking-banner ${overbooking ? 'ob-critical' : alertaOverbooking ? 'ob-warning' : 'ob-ok'}`}>
      <div className="ob-icon">{overbooking ? '🚨' : alertaOverbooking ? '⚠️' : '✅'}</div>
      <div className="ob-info">
        <span className="ob-title">
          {overbooking ? 'OVERBOOKING — Capacidade máxima atingida!' :
           alertaOverbooking ? `Alerta: apenas ${quartosDisponiveis} quarto(s) disponível(is)` :
           'Disponibilidade normal'}
        </span>
        <span className="ob-detail">
          {quartosOcupados} ocupado{quartosOcupados !== 1 ? 's' : ''} · {quartosDisponiveis} disponível{quartosDisponiveis !== 1 ? 'is' : ''} · {totalQuartos} total
        </span>
      </div>
      <div className="ob-bar-wrap">
        <div
          className="ob-bar"
          style={{ width: `${(quartosOcupados / totalQuartos) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function ReservasPage() {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('quartos');
  const [modalMov, setModalMov] = useState(null); // { quarto, tipo }
  const [form, setForm] = useState({ dataMovimentacao: '', observacao: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, h] = await Promise.all([getReservas(), getHistorico()]);
      setData(r.data);
      setHistorico(h.data);
    } catch {
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openMov = (quarto, tipo) => {
    setModalMov({ quarto, tipo });
    setForm({ dataMovimentacao: new Date().toISOString().split('T')[0], observacao: '' });
  };

  const handleMovimentar = async () => {
    if (!form.dataMovimentacao) { addToast('Data é obrigatória', 'error'); return; }
    setSaving(true);
    try {
      const res = await movimentarReserva({
        quartoId: modalMov.quarto.id,
        tipo: modalMov.tipo,
        dataMovimentacao: form.dataMovimentacao,
        observacao: form.observacao,
      });
      addToast(
        `${tipoMovLabel[modalMov.tipo]} do quarto ${modalMov.quarto.numero} registrado!`,
        'success'
      );
      if (res.data.alerta) {
        setTimeout(() => addToast(res.data.alerta, res.data.disponibilidade.overbooking ? 'error' : 'warning', 6000), 500);
      }
      setModalMov(null);
      load();
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao registrar movimentação', 'error');
    } finally {
      setSaving(false);
    }
  };

  const alert = data?.disponibilidade?.overbooking
    ? { type: 'danger', icon: '🚨', message: 'OVERBOOKING: Hotel em capacidade máxima!' }
    : data?.disponibilidade?.alertaOverbooking
    ? { type: 'warning', icon: '⚠️', message: `Atenção: apenas ${data.disponibilidade.quartosDisponiveis} quarto(s) disponível(is)!` }
    : null;

  // Sort quartos alphabetically by numero
  const quartosOrdenados = data?.quartos
    ? [...data.quartos].sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))
    : [];

  return (
    <Layout title="Gestão de Reservas" alert={alert}>
      <div className="reservas-page animate-fade">
        {data?.disponibilidade && <OverbookingBanner disponibilidade={data.disponibilidade} />}

        <div className="tab-bar">
          <button className={`tab ${tab === 'quartos' ? 'active' : ''}`} onClick={() => setTab('quartos')}>
            Quartos & Movimentação
          </button>
          <button className={`tab ${tab === 'historico' ? 'active' : ''}`} onClick={() => setTab('historico')}>
            Histórico Completo
          </button>
        </div>

        {loading ? (
          <div className="loading-state">Carregando...</div>
        ) : tab === 'quartos' ? (
          <div className="quartos-grid">
            {quartosOrdenados.map(q => (
              <div key={q.id} className={`quarto-card ${q.ocupado ? 'ocupado' : 'livre'}`}>
                <div className="qc-header">
                  <span className="qc-num">{q.numero}</span>
                  <span className={`badge badge-${q.tipo.toLowerCase()}`}>{tipoLabel[q.tipo]}</span>
                </div>
                <div className="qc-status">
                  <span className={`status-dot ${q.ocupado ? 'red' : 'green'}`} />
                  <span>{q.ocupado ? 'Ocupado' : 'Disponível'}</span>
                </div>
                <div className="qc-info">
                  <span>👥 {q.capacidade} pessoa{q.capacidade !== 1 ? 's' : ''}</span>
                  <span>R$ {parseFloat(q.precoPorNoite).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/noite</span>
                </div>
                {q.ultimaMovimentacao && (
                  <div className="qc-last">
                    <span>Última mov.: {new Date(q.ultimaMovimentacao.dataMovimentacao).toLocaleDateString('pt-BR')}</span>
                    <span>por {q.ultimaMovimentacao.usuario?.nome}</span>
                  </div>
                )}
                <div className="qc-actions">
                  {!q.ocupado ? (
                    <button className="btn-mov entrada" onClick={() => openMov(q, 'ENTRADA')}>
                      ▲ Check-in
                    </button>
                  ) : (
                    <button className="btn-mov saida" onClick={() => openMov(q, 'SAIDA')}>
                      ▼ Check-out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="historico-wrap">
            <table className="quartos-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Quarto</th>
                  <th>Tipo Mov.</th>
                  <th>Responsável</th>
                  <th>Observação</th>
                  <th>Registrado em</th>
                </tr>
              </thead>
              <tbody>
                {historico.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Nenhuma movimentação registrada</td></tr>
                )}
                {historico.map(m => (
                  <tr key={m.id}>
                    <td>{new Date(m.dataMovimentacao).toLocaleDateString('pt-BR')}</td>
                    <td><span className="quarto-num">{m.quarto.numero}</span> <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({tipoLabel[m.quarto.tipo]})</span></td>
                    <td>
                      <span className={`badge ${m.tipo === 'ENTRADA' ? 'badge-occupied' : 'badge-available'}`}>
                        {m.tipo === 'ENTRADA' ? '▲' : '▼'} {tipoMovLabel[m.tipo]}
                      </span>
                    </td>
                    <td>{m.usuario.nome}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{m.observacao || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">{historico.length} movimentação{historico.length !== 1 ? 'ões' : ''} registrada{historico.length !== 1 ? 's' : ''}</div>
          </div>
        )}
      </div>

      {/* Modal Movimentação */}
      <Modal
        open={!!modalMov}
        onClose={() => setModalMov(null)}
        title={modalMov ? `${tipoMovLabel[modalMov.tipo]} — Quarto ${modalMov.quarto.numero}` : ''}
        width={440}
      >
        {modalMov && (
          <div>
            <div className="mov-quarto-info">
              <span className={`badge badge-${modalMov.quarto.tipo.toLowerCase()}`}>{tipoLabel[modalMov.quarto.tipo]}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {modalMov.quarto.capacidade} pessoa{modalMov.quarto.capacidade !== 1 ? 's' : ''} · R$ {parseFloat(modalMov.quarto.precoPorNoite).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/noite
              </span>
            </div>
            <div className="gold-line" />
            <div className="form-grid">
              <div className="form-field full-width">
                <label>Data da Movimentação *</label>
                <input
                  type="date"
                  value={form.dataMovimentacao}
                  onChange={e => setForm(p => ({ ...p, dataMovimentacao: e.target.value }))}
                />
              </div>
              <div className="form-field full-width">
                <label>Observação</label>
                <textarea
                  rows={3}
                  value={form.observacao}
                  onChange={e => setForm(p => ({ ...p, observacao: e.target.value }))}
                  placeholder="Ex: Nome do hóspede, motivo..."
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setModalMov(null)}>Cancelar</button>
              <button
                className={`btn ${modalMov.tipo === 'ENTRADA' ? 'btn-entrada' : 'btn-saida'}`}
                onClick={handleMovimentar}
                disabled={saving}
              >
                {saving ? 'Registrando...' : `Confirmar ${tipoMovLabel[modalMov.tipo]}`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}
