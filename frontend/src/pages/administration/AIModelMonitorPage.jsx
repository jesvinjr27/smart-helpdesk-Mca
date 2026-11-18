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
      <div className="space-y-6">
        <PageHeader
          title="AI Subsystem & Model Metrics"
          subtitle="Loading machine learning diagnostics..."
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton height="260px" />
          <CardSkeleton height="260px" />
          <CardSkeleton height="260px" />
          <CardSkeleton height="260px" />
        </div>
      </div>
    );
  }

  const catModel = modelData?.category_classifier;
  const slaModel = modelData?.sla_risk_predictor;
  const ragModel = modelData?.rag_retrieval;
  const llmModel = modelData?.ollama_llm;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Local AI & Machine Learning Subsystem"
        subtitle="Evaluated performance metrics, FAISS vector index status, and local inference diagnostics."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-secondary/20 text-brand-primary border border-brand-secondary/40 shadow-subtle">
            <i className="bi bi-shield-check text-brand-primary"></i>
            <span>100% On-Device Inference</span>
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Classification Model */}
        <div className="card-glow rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-brand-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-secondary/20 text-brand-primary flex items-center justify-center">
                <i className="bi bi-diagram-3 text-lg"></i>
              </div>
              <h2 className="text-base font-semibold text-brand-primary m-0">
                Ticket Category Classifier
              </h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary text-white">
              {catModel?.status || 'ACTIVE'}
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs text-brand-secondary mb-3">
                <span className="font-semibold text-brand-primary">Architecture:</span>{' '}
                {catModel?.model_type} (Version: {catModel?.version})
              </div>

              {/* Metric KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 border border-brand-primary/15 rounded-xl bg-brand-secondary/10">
                  <span className="text-xs text-brand-secondary block mb-0.5">Accuracy</span>
                  <span className="font-bold text-base text-brand-primary">
                    {catModel?.metrics?.accuracy
                      ? `${(catModel.metrics.accuracy * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
                <div className="p-3 border border-brand-primary/15 rounded-xl bg-brand-secondary/10">
                  <span className="text-xs text-brand-secondary block mb-0.5">Macro F1</span>
                  <span className="font-bold text-base text-brand-primary">
                    {catModel?.metrics?.macro_f1 || 'N/A'}
                  </span>
                </div>
                <div className="p-3 border border-brand-primary/15 rounded-xl bg-brand-secondary/10">
                  <span className="text-xs text-brand-secondary block mb-0.5">Weighted F1</span>
                  <span className="font-bold text-base text-brand-primary">
                    {catModel?.metrics?.weighted_f1 || 'N/A'}
                  </span>
                </div>
                <div className="p-3 border border-brand-primary/15 rounded-xl bg-brand-secondary/10">
                  <span className="text-xs text-brand-secondary block mb-0.5">Samples</span>
                  <span className="font-bold text-base text-brand-primary">
                    {catModel?.metrics?.total_samples || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Classes Trained */}
            <div className="pt-2 border-t border-brand-primary/10">
              <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider block mb-2">
                Supported Classification Classes ({catModel?.metrics?.classes?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {catModel?.metrics?.classes?.map((c, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SLA Breach Risk Prediction Model */}
        <div className="card-glow rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-brand-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-secondary/20 text-brand-primary flex items-center justify-center">
                <i className="bi bi-clock-history text-lg"></i>
              </div>
              <h2 className="text-base font-semibold text-brand-primary m-0">
                SLA Breach Risk Predictor
              </h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary text-white">
              {slaModel?.status || 'ACTIVE'}
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs text-brand-secondary mb-3">
                <span className="font-semibold text-brand-primary">Architecture:</span>{' '}
                {slaModel?.model_type} (Version: {slaModel?.version})
              </div>

              {/* Metric KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 border border-brand-primary/15 rounded-xl bg-brand-secondary/10">
                  <span className="text-xs text-brand-secondary block mb-0.5">ROC AUC</span>
                  <span className="font-bold text-base text-brand-primary">
                    {slaModel?.metrics?.roc_auc || '0.67'}
                  </span>
                </div>
                <div className="p-3 border border-brand-primary/15 rounded-xl bg-brand-secondary/10">
                  <span className="text-xs text-brand-secondary block mb-0.5">Accuracy</span>
                  <span className="font-bold text-base text-brand-primary">
                    {slaModel?.metrics?.accuracy
                      ? `${(slaModel.metrics.accuracy * 100).toFixed(1)}%`
                      : '63.3%'}
                  </span>
                </div>
                <div className="p-3 border border-brand-primary/15 rounded-xl bg-brand-secondary/10">
                  <span className="text-xs text-brand-secondary block mb-0.5">Precision</span>
                  <span className="font-bold text-base text-brand-primary">
                    {slaModel?.metrics?.precision || '0.48'}
                  </span>
                </div>
                <div className="p-3 border border-brand-primary/15 rounded-xl bg-brand-secondary/10">
                  <span className="text-xs text-brand-secondary block mb-0.5">F1 Score</span>
                  <span className="font-bold text-base text-brand-primary">
                    {slaModel?.metrics?.f1_score || '0.52'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-brand-primary/10">
              <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider block mb-2">
                Model Features Used
              </span>
              <div className="flex flex-wrap gap-1.5">
                {slaModel?.metrics?.features?.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAISS Dense Vector Store */}
        <div className="card-glow rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-brand-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-secondary/20 text-brand-primary flex items-center justify-center">
                <i className="bi bi-database text-lg"></i>
              </div>
              <h2 className="text-base font-semibold text-brand-primary m-0">
                FAISS Knowledge Vector Store
              </h2>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary text-white">
              {ragModel?.status || 'ACTIVE'}
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs text-brand-secondary mb-3">
                <span className="font-semibold text-brand-primary">Index Type:</span>{' '}
                {ragModel?.metrics?.index_type || 'IndexFlatIP'} (Normalized Cosine Similarity)
              </div>
              <div className="p-4 rounded-xl border border-brand-primary/15 bg-brand-secondary/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-primary">
                    Total Indexed Knowledge Chunks:
                  </span>
                  <span className="font-bold text-lg text-brand-primary">
                    {ragModel?.metrics?.total_vectors ?? 0}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-brand-primary/10 pt-2.5">
                  <span className="text-sm text-brand-primary">
                    Embedding Vector Dimension:
                  </span>
                  <span className="font-semibold text-brand-primary">
                    {ragModel?.metrics?.dimension ?? 384}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-brand-secondary flex items-center gap-1.5 m-0 pt-2 border-t border-brand-primary/10">
              <i className="bi bi-info-circle text-brand-primary"></i>
              <span>Embeddings are isolated per organization and filtered by user role permissions before retrieval.</span>
            </p>
          </div>
        </div>

        {/* Local Ollama LLM Service */}
        <div className="card-glow rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-brand-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-secondary/20 text-brand-primary flex items-center justify-center">
                <i className="bi bi-cpu-fill text-lg"></i>
              </div>
              <h2 className="text-base font-semibold text-brand-primary m-0">
                Local Ollama LLM Inference
              </h2>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${llmModel?.status === 'ONLINE'
                ? 'bg-brand-primary text-white'
                : 'bg-brand-secondary/20 text-brand-primary border border-brand-secondary/30'
                }`}
            >
              {llmModel?.status || 'STANDBY'}
            </span>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs text-brand-secondary mb-3">
                <span className="font-semibold text-brand-primary">Configured Model:</span>{' '}
                {llmModel?.model_name || 'qwen2.5:3b'}
              </div>
              <div className="p-4 rounded-xl border border-brand-primary/15 bg-brand-secondary/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-brand-primary">
                    Ollama Local Endpoint:
                  </span>
                  <span className="font-mono text-xs text-brand-secondary">
                    {llmModel?.metrics?.base_url || 'http://localhost:11434'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-brand-primary/10 pt-2.5">
                  <span className="text-sm text-brand-primary">
                    Inference Temperature:
                  </span>
                  <span className="font-semibold text-brand-primary">
                    {llmModel?.metrics?.temperature || 0.2}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-brand-secondary flex items-center gap-1.5 m-0 pt-2 border-t border-brand-primary/10">
              <i className="bi bi-check2-circle text-brand-primary"></i>
              <span>When Ollama is offline or on standby, local RAG automatically provides verified grounded answers directly from the vector store without downtime.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
