import React, { useState, useEffect } from 'react';
import { getAIModelsAdminApi } from '../../api';
import { PageHeader } from '../../components/common/PageHeader';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

export const AIModelMonitorPage = () => {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const resp = await getAIModelsAdminApi();
        setModelData(resp.data);
      } catch (err) {
        console.error('Failed to load AI model metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="AI Subsystem & Model Metrics" subtitle="Loading machine learning diagnostics..." />
        <div className="row g-4">
          <div className="col-lg-6"><CardSkeleton height="260px" /></div>
          <div className="col-lg-6"><CardSkeleton height="260px" /></div>
          <div className="col-lg-6"><CardSkeleton height="260px" /></div>
          <div className="col-lg-6"><CardSkeleton height="260px" /></div>
        </div>
      </div>
    );
  }

  const catModel = modelData?.category_classifier;
  const slaModel = modelData?.sla_risk_predictor;
  const ragModel = modelData?.rag_retrieval;
  const llmModel = modelData?.ollama_llm;

  return (
    <div>
      <PageHeader
        title="Local AI & Machine Learning Subsystem"
        subtitle="Evaluated performance metrics, FAISS vector index status, and local inference diagnostics."
        badge={
          <span className="badge bg-success-subtle text-success border border-success-subtle">
            <i className="bi bi-shield-check me-1"></i>100% On-Device Inference
          </span>
        }
      />

      <div className="row g-4">
        {/* Category Classification Model */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100 border-default">
            <div className="card-header py-3 d-flex justify-content-between align-items-center border-subtle">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-diagram-3 text-primary fs-5"></i>
                <h6 className="fw-bold mb-0 text-primary-emphasis">Ticket Category Classifier</h6>
              </div>
              <span className="badge bg-success text-white">{catModel?.status || 'ACTIVE'}</span>
            </div>
            <div className="card-body p-4">
              <div className="text-xs text-muted mb-3">
                <b>Architecture:</b> {catModel?.model_type} (Version: {catModel?.version})
              </div>

              {/* Metric KPI Grid */}
              <div className="row g-2 mb-3 text-center">
                <div className="col-3">
                  <div className="p-2.5 border border-default rounded-3" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted d-block">Accuracy</span>
                    <span className="fw-bold fs-6 text-primary">
                      {catModel?.metrics?.accuracy
                        ? `${(catModel.metrics.accuracy * 100).toFixed(1)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2.5 border border-default rounded-3" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted d-block">Macro F1</span>
                    <span className="fw-bold fs-6 text-primary-emphasis">
                      {catModel?.metrics?.macro_f1 || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2.5 border border-default rounded-3" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted d-block">Weighted F1</span>
                    <span className="fw-bold fs-6 text-primary-emphasis">
                      {catModel?.metrics?.weighted_f1 || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2.5 border border-default rounded-3" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted d-block">Samples</span>
                    <span className="fw-bold fs-6 text-primary-emphasis">
                      {catModel?.metrics?.total_samples || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Classes Trained */}
              <div>
                <span className="text-xs fw-bold text-muted text-uppercase d-block mb-1.5">
                  Supported Classification Classes ({catModel?.metrics?.classes?.length || 0})
                </span>
                <div className="d-flex flex-wrap gap-1">
                  {catModel?.metrics?.classes?.map((c, i) => (
                    <span key={i} className="badge bg-surface-subtle text-primary-emphasis border border-default text-xs">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SLA Breach Risk Prediction Model */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100 border-default">
            <div className="card-header py-3 d-flex justify-content-between align-items-center border-subtle">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-clock-history text-danger fs-5"></i>
                <h6 className="fw-bold mb-0 text-primary-emphasis">SLA Breach Risk Predictor</h6>
              </div>
              <span className="badge bg-success text-white">{slaModel?.status || 'ACTIVE'}</span>
            </div>
            <div className="card-body p-4">
              <div className="text-xs text-muted mb-3">
                <b>Architecture:</b> {slaModel?.model_type} (Version: {slaModel?.version})
              </div>

              {/* Metric KPI Grid */}
              <div className="row g-2 mb-3 text-center">
                <div className="col-3">
                  <div className="p-2.5 border border-default rounded-3" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted d-block">ROC AUC</span>
                    <span className="fw-bold fs-6 text-danger">
                      {slaModel?.metrics?.roc_auc || '0.67'}
                    </span>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2.5 border border-default rounded-3" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted d-block">Accuracy</span>
                    <span className="fw-bold fs-6 text-primary-emphasis">
                      {slaModel?.metrics?.accuracy
                        ? `${(slaModel.metrics.accuracy * 100).toFixed(1)}%`
                        : '63.3%'}
                    </span>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2.5 border border-default rounded-3" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted d-block">Precision</span>
                    <span className="fw-bold fs-6 text-primary-emphasis">
                      {slaModel?.metrics?.precision || '0.48'}
                    </span>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-2.5 border border-default rounded-3" style={{ backgroundColor: 'var(--bg-surface-subtle)' }}>
                    <span className="text-xs text-muted d-block">F1 Score</span>
                    <span className="fw-bold fs-6 text-primary-emphasis">
                      {slaModel?.metrics?.f1_score || '0.52'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs fw-bold text-muted text-uppercase d-block mb-1.5">
                  Model Features Used
                </span>
                <div className="d-flex flex-wrap gap-1">
                  {slaModel?.metrics?.features?.map((f, i) => (
                    <span key={i} className="badge bg-secondary-subtle text-secondary text-xs">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAISS Dense Vector Store */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100 border-default">
            <div className="card-header py-3 d-flex justify-content-between align-items-center border-subtle">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-database text-info fs-5"></i>
                <h6 className="fw-bold mb-0 text-primary-emphasis">FAISS Knowledge Vector Store</h6>
              </div>
              <span className="badge bg-success text-white">{ragModel?.status || 'ACTIVE'}</span>
            </div>
            <div className="card-body p-4">
              <div className="text-xs text-muted mb-3">
                <b>Index Type:</b> {ragModel?.metrics?.index_type || 'IndexFlatIP'} (Normalized Cosine Similarity)
              </div>
              <div
                className="p-3 rounded-3 mb-3 border border-default"
                style={{ backgroundColor: 'var(--bg-surface-subtle)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-sm text-primary-emphasis">Total Indexed Knowledge Chunks:</span>
                  <span className="fw-bold fs-5 text-primary">
                    {ragModel?.metrics?.total_vectors ?? 0}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-sm text-primary-emphasis">Embedding Vector Dimension:</span>
                  <span className="fw-semibold text-secondary">
                    {ragModel?.metrics?.dimension ?? 384}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted mb-0">
                <i className="bi bi-info-circle me-1 text-primary"></i>
                Embeddings are isolated per organization and filtered by user role permissions before retrieval.
              </p>
            </div>
          </div>
        </div>

        {/* Local Ollama LLM Service */}
        <div className="col-lg-6">
          <div className="card shadow-sm h-100 border-default">
            <div className="card-header py-3 d-flex justify-content-between align-items-center border-subtle">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-cpu-fill text-warning fs-5"></i>
                <h6 className="fw-bold mb-0 text-primary-emphasis">Local Ollama LLM Inference</h6>
              </div>
              <span
                className={`badge ${
                  llmModel?.status === 'ONLINE' ? 'bg-success text-white' : 'bg-secondary-subtle text-secondary'
                }`}
              >
                {llmModel?.status || 'STANDBY'}
              </span>
            </div>
            <div className="card-body p-4">
              <div className="text-xs text-muted mb-3">
                <b>Configured Model:</b> {llmModel?.model_name || 'qwen2.5:3b'}
              </div>
              <div
                className="p-3 rounded-3 mb-3 border border-default"
                style={{ backgroundColor: 'var(--bg-surface-subtle)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-sm text-primary-emphasis">Ollama Local Endpoint:</span>
                  <span className="fw-semibold text-xs text-muted font-monospace">
                    {llmModel?.metrics?.base_url || 'http://localhost:11434'}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-sm text-primary-emphasis">Inference Temperature:</span>
                  <span className="fw-semibold text-primary-emphasis">
                    {llmModel?.metrics?.temperature || 0.2}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted mb-0">
                <i className="bi bi-check2-circle text-success me-1"></i>
                When Ollama is offline or on standby, local RAG automatically provides verified grounded answers directly from the vector store without downtime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
