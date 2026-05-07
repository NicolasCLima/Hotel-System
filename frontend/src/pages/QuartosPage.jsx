import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import { getQuartos, criarQuarto, editarQuarto, excluirQuarto } from '../services/api';
import { useToast } from '../context/ToastContext';
import './QuartosPage.css';
import '../components/Modal.css';

const TIPOS = ['SIMPLES', 'DUPLO', 'SUITE'];
const tipoLabel = { SIMPLES: 'Simples', DUPLO: 'Duplo', SUITE: 'Suíte' };

const emptyForm = { numero: '', tipo: 'SIMPLES', capacidade: '', precoPorNoite: '', descricao: '', ativo: true };

function QuartoForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.numero.trim()) e.numero = 'Número é obrigatório';
    if (!form.tipo) e.tipo = 'Tipo é obrigatório';
    if (!form.capacidade || form.capacidade < 1) e.capacidade = 'Capacidade mínima: 1';
    if (!form.precoPorNoite || form.precoPorNoite <= 0) e.precoPorNoite = 'Preço deve ser maior que 0';
    return e;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    setErrors(p => ({ ...p, [field]: undefined }));
  };

  return (
    <div>
      <div className="form-grid">
        <div className="form-field">
          <label>Número do Quarto *</label>
          <input
            value={form.numero}
            onChange={e => set('numero', e.target.value)}
            placeholder="ex: 101"
            className={errors.numero ? 'error' : ''}
          />
          {errors.numero && <span className="err">{errors.numero}</span>}
        </div>
        <div className="form-field">
          <label>Tipo *</label>
          <select value={form.tipo} onChange={e => set('tipo', e.target.value)} className={errors.tipo ? 'error' : ''}>
            {TIPOS.map(t => <option key={t} value={t}>{tipoLabel[t]}</option>)}
          </select>
          {errors.tipo && <span className="err">{errors.tipo}</span>}
        </div>
        <div className="form-field">
          <label>Capacidade (pessoas) *</label>
          <input
            type="number" min="1" max="10"
            value={form.capacidade}
            onChange={e => set('capacidade', e.target.value)}
            placeholder="ex: 2"
            className={errors.capacidade ? 'error' : ''}
          />
          {errors.capacidade && <span className="err">{errors.capacidade}</span>}
        </div>
        <div className="form-field">
          <label>Preço por Noite (R$) *</label>
          <input
            type="number" min="0" step="0.01"
            value={form.precoPorNoite}
            onChange={e => set('precoPorNoite', e.target.value)}
            placeholder="ex: 280.00"
            className={errors.precoPorNoite ? 'error' : ''}
          />
          {errors.precoPorNoite && <span className="err">{errors.precoPorNoite}</span>}
        </div>
        <div className="form-field full-width">
          <label>Descrição</label>
          <textarea
            rows={3}
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
            placeholder="Descrição do quarto (opcional)"
            style={{ resize: 'vertical' }}
          />
        </div>
        {initial && (
          <div className="form-field">
            <label>Status</label>
            <select value={form.ativo ? 'true' : 'false'} onChange={e => set('ativo', e.target.value === 'true')}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
        )}
      </div>
      <div className="form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Salvando...' : initial ? 'Salvar Alterações' : 'Cadastrar Quarto'}
        </button>
      </div>
    </div>
  );
}

export default function QuartosPage() {
  const { addToast } = useToast();
  const [quartos, setQuartos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [modalCreate, setModalCreate] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (b = '') => {
    setLoading(true);
    try {
      const { data } = await getQuartos(b);
      setQuartos(data);
    } catch {
      addToast('Erro ao carregar quartos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBusca = () => {
    setBusca(buscaInput);
    load(buscaInput);
  };

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await criarQuarto(form);
      addToast('Quarto cadastrado com sucesso!', 'success');
      setModalCreate(false);
      load(busca);
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao cadastrar quarto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (form) => {
    setSaving(true);
    try {
      await editarQuarto(modalEdit.id, form);
      addToast('Quarto atualizado com sucesso!', 'success');
      setModalEdit(null);
      load(busca);
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao atualizar quarto', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await excluirQuarto(modalDelete.id);
      addToast('Quarto excluído com sucesso!', 'success');
      setModalDelete(null);
      load(busca);
    } catch (err) {
      addToast(err.response?.data?.error || 'Erro ao excluir quarto', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Cadastro de Quartos">
      <div className="quartos-page animate-fade">
        <div className="page-toolbar">
          <div className="search-bar">
            <input
              value={buscaInput}
              onChange={e => setBuscaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBusca()}
              placeholder="Buscar por número, tipo ou descrição..."
            />
            <button className="btn btn-secondary" onClick={handleBusca}>Buscar</button>
            {busca && <button className="btn btn-secondary" onClick={() => { setBuscaInput(''); setBusca(''); load(''); }}>Limpar</button>}
          </div>
          <button className="btn btn-primary" onClick={() => setModalCreate(true)}>+ Novo Quarto</button>
        </div>

        {loading ? (
          <div className="loading-state">Carregando quartos...</div>
        ) : quartos.length === 0 ? (
          <div className="empty-state">
            <span>⊞</span>
            <p>{busca ? 'Nenhum quarto encontrado para esta busca' : 'Nenhum quarto cadastrado'}</p>
            <button className="btn btn-primary" onClick={() => setModalCreate(true)}>Cadastrar primeiro quarto</button>
          </div>
        ) : (
          <div className="quartos-table-wrap">
            <table className="quartos-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Capacidade</th>
                  <th>Preço/Noite</th>
                  <th>Status</th>
                  <th>Ocupação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {quartos.map(q => (
                  <tr key={q.id} className={!q.ativo ? 'inactive' : ''}>
                    <td><span className="quarto-num">{q.numero}</span></td>
                    <td><span className={`badge badge-${q.tipo.toLowerCase()}`}>{tipoLabel[q.tipo]}</span></td>
                    <td>{q.capacidade} pessoa{q.capacidade !== 1 ? 's' : ''}</td>
                    <td>R$ {parseFloat(q.precoPorNoite).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${q.ativo ? 'badge-available' : ''}`} style={!q.ativo ? { background: 'rgba(100,100,100,0.15)', color: '#888', border: '1px solid #444' } : {}}>
                        {q.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${q.ocupado ? 'badge-occupied' : 'badge-available'}`}>
                        {q.ocupado ? '● Ocupado' : '○ Livre'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="act-btn edit" onClick={() => setModalEdit(q)} title="Editar">✎</button>
                        <button className="act-btn delete" onClick={() => setModalDelete(q)} title="Excluir">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              {quartos.length} quarto{quartos.length !== 1 ? 's' : ''} encontrado{quartos.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Modal Criar */}
      <Modal open={modalCreate} onClose={() => setModalCreate(false)} title="Novo Quarto">
        <QuartoForm onSave={handleCreate} onCancel={() => setModalCreate(false)} loading={saving} />
      </Modal>

      {/* Modal Editar */}
      <Modal open={!!modalEdit} onClose={() => setModalEdit(null)} title={`Editar Quarto ${modalEdit?.numero}`}>
        {modalEdit && (
          <QuartoForm
            initial={{ ...modalEdit, precoPorNoite: String(modalEdit.precoPorNoite), capacidade: String(modalEdit.capacidade) }}
            onSave={handleEdit}
            onCancel={() => setModalEdit(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Modal Confirmar Exclusão */}
      <Modal open={!!modalDelete} onClose={() => setModalDelete(null)} title="Confirmar Exclusão" width={420}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          Deseja excluir o quarto <strong style={{ color: 'var(--text-primary)' }}>{modalDelete?.numero}</strong>?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Quartos com histórico de movimentações não podem ser excluídos. Desative-os em vez disso.
        </p>
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={() => setModalDelete(null)}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            {saving ? 'Excluindo...' : 'Excluir Quarto'}
          </button>
        </div>
      </Modal>
    </Layout>
  );
}
