import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  getArticlesApi,
  createArticleApi,
  getCategoriesApi,
  triggerKnowledgeIngestApi,
  getKnowledgeIngestStatusApi,
  searchKnowledgeApi,
} from '../../api';
import { PageHeader } from '../../components/common/PageHeader';
import { ModernModal } from '../../components/common/ModernModal';
import { EmptyState } from '../../components/common/EmptyState';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';

export const KnowledgeBasePage = () => {
  const { hasRole } = useAuth();
  const canManageArticles = hasRole(['AGENT', 'LEAD', 'ORG_ADMIN', 'SYS_ADMIN']);

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read Article Modal
  const [activeArticle, setActiveArticle] = useState(null);

  // New Article Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [newVisibility, setNewVisibility] = useState('PUBLIC');
  const [newTags, setNewTags] = useState('');
  const [savingArticle, setSavingArticle] = useState(false);

  // Ingestion status
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [artResp, catResp] = await Promise.all([
        getArticlesApi({ category_id: selectedCategory || undefined }),
        getCategoriesApi(),
      ]);
      setArticles(artResp.data);
      setCategories(catResp.data);
      if (catResp.data.length > 0 && !newCatId) {
        setNewCatId(catResp.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load KB data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const resp = await searchKnowledgeApi({
        query: searchQuery,
        top_k: 4,
      });
      setSearchResults(resp.data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    setSavingArticle(true);
    try {
      await createArticleApi({
        title: newTitle,
        content: newContent,
        summary: newSummary || undefined,
        category_id: newCatId,
        visibility: newVisibility,
        tags: newTags
          ? newTags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewSummary('');
      setNewTags('');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create article');
    } finally {
      setSavingArticle(false);
    }
  };

  const handleTriggerIngest = async () => {
    setIngesting(true);
    setIngestMsg('Triggering background vector embedding...');
    try {
      const resp = await triggerKnowledgeIngestApi({ rebuild_index: true });
      const jobId = resp.data.job_id;

      // Poll status
      const interval = setInterval(async () => {
        try {
          const statusResp = await getKnowledgeIngestStatusApi(jobId);
          if (statusResp.data.status === 'COMPLETED') {
            clearInterval(interval);
            setIngesting(false);
            setIngestMsg(`Success: ${statusResp.data.message}`);
            setTimeout(() => setIngestMsg(''), 5000);
          } else if (statusResp.data.status === 'FAILED') {
            clearInterval(interval);
            setIngesting(false);
            setIngestMsg(`Failed: ${statusResp.data.message}`);
          }
        } catch (e) {
          clearInterval(interval);
          setIngesting(false);
        }
      }, 1000);
    } catch (err) {
      setIngesting(false);
      alert('Failed to trigger ingestion');
    }
  };

  return (
    <div>
      <PageHeader
        title="Knowledge Base & Solution Guides"
        subtitle="Explore verified technical troubleshooting articles, procedures, and setup documentation."
        actions={
          canManageArticles && (
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={handleTriggerIngest}
                disabled={ingesting}
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5"
                title="Embeds approved articles into local FAISS vector index"
              >
                {ingesting ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <i className="bi bi-arrow-repeat"></i>
                )}
                <span>Sync Vector Store</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 shadow-sm"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Create Article</span>
              </button>
            </div>
          )
        }
      />

      {ingestMsg && (
        <div className="alert alert-info py-2.5 px-3 text-sm d-flex align-items-center gap-2 mb-4 rounded-3">
          <i className="bi bi-info-circle-fill text-info flex-shrink-0"></i>
          <span>{ingestMsg}</span>
        </div>
      )}

      {/* Semantic Search Hero Card */}
      <div
        className="card border-0 text-white p-4 p-md-5 mb-4 rounded-4 shadow-sm"
        style={{
          background: 'radial-gradient(ellipse at top, #1e3a8a 0%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="text-center position-relative" style={{ zIndex: 1 }}>
          <span className="badge bg-white bg-opacity-15 text-white px-3 py-1 rounded-pill text-xs mb-2.5">
            <i className="bi bi-stars me-1 text-warning"></i>FAISS Dense Vector Search
          </span>
          <h3 className="fw-bold mb-2">Search Knowledge Base with Semantic AI</h3>
          <p className="text-white-50 text-sm mb-4 mx-auto" style={{ maxWidth: '520px' }}>
            Our vector engine searches concepts, symptoms, and error codes across all verified articles to find exact answers.
          </p>

          <form onSubmit={handleSemanticSearch} className="mx-auto" style={{ maxWidth: '640px' }}>
            <div className="input-group input-group-lg shadow rounded-pill overflow-hidden bg-surface p-1">
              <span className="input-group-text bg-transparent border-0 ps-3 text-muted">
                <i className="bi bi-search fs-5"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 text-sm ps-2"
                placeholder="e.g. How to connect to Eduroam Wi-Fi or fix VPN error 403..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-primary px-4 fw-semibold rounded-pill">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Semantic Search Results Section (if active) */}
      {searchResults && (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0 text-primary d-flex align-items-center gap-1.5">
              <i className="bi bi-stars"></i>
              <span>Semantic AI Results ({searchResults.length})</span>
            </h6>
            <button
              onClick={() => setSearchResults(null)}
              className="btn btn-sm btn-link text-decoration-none text-muted text-xs"
            >
              <i className="bi bi-x-circle me-1"></i>Clear Search
            </button>
          </div>

          <div className="row g-3">
            {searchResults.length === 0 ? (
              <div className="col-12">
                <div className="card p-4 text-center text-muted">
                  No matching chunks found above similarity threshold. Try broadening your terms.
                </div>
              </div>
            ) : (
              searchResults.map((sr) => (
                <div key={sr.chunk_id} className="col-md-6">
                  <div className="card h-100 shadow-sm border-default p-3 card-hover-lift">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-primary-subtle text-primary text-xs">
                        <i className="bi bi-check2-circle me-1"></i>Match: {Math.round(sr.similarity_score * 100)}%
                      </span>
                      <span className="badge bg-surface-subtle text-muted border border-default text-xs">
                        {sr.visibility}
                      </span>
                    </div>
                    <h6 className="fw-bold text-primary-emphasis mb-1">{sr.article_title}</h6>
                    <p className="text-xs text-secondary mb-0 line-clamp-3" style={{ whiteSpace: 'pre-wrap' }}>
                      {sr.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('')}
          className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-semibold ${
            selectedCategory === ''
              ? 'btn-primary shadow-sm'
              : 'btn-outline-secondary'
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`btn btn-sm rounded-pill px-3 py-1.5 text-xs fw-semibold ${
              selectedCategory === c.id
                ? 'btn-primary shadow-sm'
                : 'btn-outline-secondary'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="row g-4">
          <div className="col-md-6 col-lg-4"><CardSkeleton height="200px" /></div>
          <div className="col-md-6 col-lg-4"><CardSkeleton height="200px" /></div>
          <div className="col-md-6 col-lg-4"><CardSkeleton height="200px" /></div>
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          icon="bi-journal-x"
          title="No articles found"
          description="There are no knowledge articles available in this category yet."
          action={
            canManageArticles && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm rounded-3 px-3 shadow-sm"
              >
                <i className="bi bi-plus-lg me-1"></i>Create First Article
              </button>
            )
          }
        />
      ) : (
        <div className="row g-4">
          {articles.map((art) => (
            <div key={art.id} className="col-md-6 col-lg-4">
              <div
                className="card h-100 shadow-sm cursor-pointer card-hover-lift"
                onClick={() => setActiveArticle(art)}
              >
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2.5">
                    <span className="badge bg-surface-subtle text-primary-emphasis border border-default text-xs">
                      {art.category_name || 'General'}
                    </span>
                    <span className="text-xs text-muted d-flex align-items-center gap-1">
                      <i className="bi bi-eye"></i>
                      <span>{art.view_count || 0} views</span>
                    </span>
                  </div>

                  <h6 className="fw-bold text-primary-emphasis mb-2 line-clamp-2">{art.title}</h6>
                  <p className="text-xs text-secondary flex-grow-1 line-clamp-3 mb-3">
                    {art.summary || art.content.slice(0, 140) + '...'}
                  </p>

                  <div className="d-flex flex-wrap gap-1 mt-auto pt-2 border-top border-subtle">
                    {art.tags?.slice(0, 3).map((tg, i) => (
                      <span key={i} className="badge bg-secondary-subtle text-secondary text-xs">
                        #{tg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read Article Modal */}
      <ModernModal
        isOpen={Boolean(activeArticle)}
        onClose={() => setActiveArticle(null)}
        title={activeArticle?.title}
        subtitle={activeArticle?.category_name || 'General Documentation'}
        size="lg"
        footer={
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setActiveArticle(null)}
          >
            Close Guide
          </button>
        }
      >
        <div className="text-sm text-primary-emphasis" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {activeArticle?.content}
        </div>
      </ModernModal>

      {/* Create Article Modal */}
      <ModernModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Knowledge Base Article"
        subtitle="Add a new verified technical troubleshooting guide or operational documentation."
        size="lg"
        footer={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingArticle}
              onClick={handleCreateArticle}
              className="btn btn-primary btn-sm px-3"
            >
              {savingArticle ? 'Publishing...' : 'Publish Article'}
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="form-label">Article Title</label>
          <input
            type="text"
            required
            className="form-control"
            placeholder="e.g. How to configure GlobalProtect VPN on macOS"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label className="form-label">Category</label>
            <select
              required
              className="form-select"
              value={newCatId}
              onChange={(e) => setNewCatId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-6">
            <label className="form-label">Visibility</label>
            <select
              className="form-select"
              value={newVisibility}
              onChange={(e) => setNewVisibility(e.target.value)}
            >
              <option value="PUBLIC">Public (All users & students)</option>
              <option value="INTERNAL">Internal (Only agents & leads)</option>
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Brief Summary</label>
          <input
            type="text"
            className="form-control"
            placeholder="One-sentence description for search preview"
            value={newSummary}
            onChange={(e) => setNewSummary(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Article Content</label>
          <textarea
            rows={8}
            required
            className="form-control"
            placeholder="Step 1: Open the application...&#10;Step 2: Enter server portal..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-2">
          <label className="form-label">Tags (comma-separated)</label>
          <input
            type="text"
            className="form-control"
            placeholder="vpn, security, network, macos"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
          />
        </div>
      </ModernModal>
    </div>
  );
};
