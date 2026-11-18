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
    setIngestMsg('Triggering local FAISS vector indexing...');
    try {
      await triggerKnowledgeIngestApi();
      const poll = setInterval(async () => {
        try {
          const sResp = await getKnowledgeIngestStatusApi();
          if (sResp.data.status === 'COMPLETED') {
            clearInterval(poll);
            setIngesting(false);
            setIngestMsg('Vector store successfully indexed with all approved articles.');
            setTimeout(() => setIngestMsg(''), 4000);
          }
        } catch (e) {
          clearInterval(poll);
          setIngesting(false);
        }
      }, 2000);
    } catch (err) {
      setIngesting(false);
      alert('Failed to trigger ingestion');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base & Documentation"
        subtitle="Verified troubleshooting guides, IT policy documentation, and local RAG retrieval sources."
        actions={
          canManageArticles && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={ingesting}
                onClick={handleTriggerIngest}
                className="px-3.5 py-1.5 rounded-xl border border-brand-secondary/40 bg-app-background text-brand-primary hover:bg-brand-secondary/15 text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {ingesting ? (
                  <span className="w-3.5 h-3.5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <i className="bi bi-arrow-repeat text-xs text-brand-primary" />
                )}
                <span>Sync Vector Store</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary text-white text-xs sm:text-sm font-semibold shadow-subtle transition-colors inline-flex items-center gap-1.5"
              >
                <i className="bi bi-plus-lg text-xs" />
                <span>Create Article</span>
              </button>
            </div>
          )
        }
      />

      {ingestMsg && (
        <div className="p-3.5 rounded-xl bg-brand-secondary/15 border border-brand-secondary/40 flex items-center gap-2.5 text-xs text-brand-primary">
          <i className="bi bi-info-circle-fill text-brand-primary text-sm flex-shrink-0" />
          <span>{ingestMsg}</span>
        </div>
      )}

      {/* Semantic Search Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-primary p-6 sm:p-10 text-white shadow-subtle text-center">
        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-secondary/20 text-brand-accent border border-brand-accent/30">
            <i className="bi bi-stars text-brand-accent" />
            <span>FAISS Dense Vector Search</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Search Knowledge Base with Semantic AI
          </h2>
          <p className="text-brand-accent/90 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Our vector engine searches concepts, symptoms, and error codes across all verified articles to find exact answers.
          </p>

          <form onSubmit={handleSemanticSearch} className="pt-2">
            <div className="flex items-center bg-app-background border border-brand-secondary/40 rounded-full shadow-subtle p-1.5 focus-within:ring-2 focus-within:ring-brand-accent/40 text-brand-primary transition-all">
              <span className="pl-3.5 text-brand-secondary text-base">
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                className="flex-1 bg-transparent border-0 px-3 text-xs sm:text-sm text-brand-primary placeholder-brand-secondary/60 focus:outline-none"
                placeholder="e.g. How to connect to Eduroam Wi-Fi or fix VPN error 403..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-xs sm:text-sm rounded-full shadow-subtle transition-colors flex-shrink-0"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Semantic Search Results Section (if active) */}
      {searchResults && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-brand-primary inline-flex items-center gap-1.5">
              <i className="bi bi-stars text-brand-secondary" />
              <span>Semantic AI Results ({searchResults.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setSearchResults(null)}
              className="text-xs text-brand-secondary hover:text-brand-primary inline-flex items-center gap-1 transition-colors"
            >
              <i className="bi bi-x-circle" />
              <span>Clear Search</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchResults.length === 0 ? (
              <div className="col-span-full p-6 rounded-xl bg-app-background border border-brand-primary/15 text-center text-xs text-brand-secondary">
                No matching chunks found above similarity threshold. Try broadening your terms.
              </div>
            ) : (
              searchResults.map((sr) => (
                <div
                  key={sr.chunk_id}
                  className="p-4 rounded-2xl card-glow-interactive space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-secondary/20 text-brand-primary border border-brand-secondary/40 inline-flex items-center gap-1">
                      <i className="bi bi-check2-circle text-xs text-brand-primary" />
                      <span>Match: {Math.round(sr.similarity_score * 100)}%</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-brand-secondary/10 text-brand-primary border border-brand-secondary/20">
                      {sr.visibility}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-brand-primary truncate">
                    {sr.article_title}
                  </h4>
                  <p className="text-xs text-brand-primary/80 line-clamp-3 leading-relaxed">
                    {sr.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === ''
            ? 'bg-brand-primary text-white shadow-subtle'
            : 'bg-app-background border border-brand-secondary/40 text-brand-primary hover:bg-brand-secondary/15'
            }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === c.id
              ? 'bg-brand-primary text-white shadow-subtle'
              : 'bg-app-background border border-brand-secondary/40 text-brand-primary hover:bg-brand-secondary/15'
              }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <CardSkeleton height="200px" />
          <CardSkeleton height="200px" />
          <CardSkeleton height="200px" />
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
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium text-xs sm:text-sm rounded-xl shadow-subtle transition-colors inline-flex items-center gap-1.5"
              >
                <i className="bi bi-plus-lg text-xs" />
                <span>Create First Article</span>
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((art) => (
            <div
              key={art.id}
              onClick={() => setActiveArticle(art)}
              className="card-glow-interactive p-5 rounded-2xl flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/15 text-brand-primary border border-brand-secondary/30">
                    {art.category_name || 'General'}
                  </span>
                  <span className="text-[11px] text-brand-secondary inline-flex items-center gap-1">
                    <i className="bi bi-eye text-xs" />
                    <span>{art.view_count || 0} views</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm text-brand-primary group-hover:text-brand-secondary transition-colors line-clamp-2 mb-2">
                  {art.title}
                </h3>
                <p className="text-xs text-brand-primary/75 line-clamp-3 leading-relaxed mb-4">
                  {art.summary || art.content.slice(0, 140) + '...'}
                </p>
              </div>

              <div className="flex flex-wrap gap-1 pt-3 border-t border-brand-primary/10">
                {art.tags?.slice(0, 3).map((tg, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-brand-secondary/15 text-brand-primary border border-brand-secondary/20"
                  >
                    #{tg}
                  </span>
                ))}
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
            className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-brand-secondary/40 bg-app-background text-brand-primary hover:bg-brand-secondary/15 transition-colors"
            onClick={() => setActiveArticle(null)}
          >
            Close Guide
          </button>
        }
      >
        <div className="text-sm text-brand-primary whitespace-pre-wrap leading-relaxed space-y-2">
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
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl border border-brand-secondary/40 bg-app-background text-brand-primary hover:bg-brand-secondary/15 transition-colors"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingArticle}
              onClick={handleCreateArticle}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-colors disabled:opacity-50"
            >
              {savingArticle ? 'Publishing...' : 'Publish Article'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Article Title
            </label>
            <input
              type="text"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              placeholder="e.g. How to configure GlobalProtect VPN on macOS"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Category
              </label>
              <select
                required
                className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
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

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
                Visibility
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors cursor-pointer"
                value={newVisibility}
                onChange={(e) => setNewVisibility(e.target.value)}
              >
                <option value="PUBLIC">Public (All users & students)</option>
                <option value="INTERNAL">Internal (Only agents & leads)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Brief Summary
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              placeholder="One-sentence description for search preview"
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Article Content
            </label>
            <textarea
              rows={8}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors resize-y"
              placeholder="Step 1: Open the application...&#10;Step 2: Enter server portal..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
              placeholder="vpn, security, network, macos"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
            />
          </div>
        </div>
      </ModernModal>
    </div>
  );
};
