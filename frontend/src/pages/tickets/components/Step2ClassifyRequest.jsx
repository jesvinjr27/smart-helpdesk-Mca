import React from 'react';
import { CategoryCard } from './CategoryCard';
import { DynamicCategoryFields } from './DynamicCategoryFields';
import { PrioritySelector } from './PrioritySelector';

export const Step2ClassifyRequest = ({
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  dynamicData,
  setDynamicData,
  priority,
  setPriority,
  criticalNotice,
  tagsInput,
  setTagsInput,
  onBack,
  onNext,
}) => {
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const isValid = Boolean(selectedCategoryId);

  return (
    <div className="card-glow p-5 sm:p-7 rounded-2xl space-y-6">
      {/* Category Selection Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Select Help Desk Category <span className="text-brand-primary font-bold">*</span>
          </label>
          <span className="text-[11px] text-brand-secondary">
            {categories.length} categories available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isSelected={selectedCategoryId === cat.id}
              onSelect={setSelectedCategoryId}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Contextual Details */}
      {selectedCategory && (
        <DynamicCategoryFields
          categoryName={selectedCategory.name}
          dynamicData={dynamicData}
          setDynamicData={setDynamicData}
        />
      )}

      {/* Priority Selector */}
      <PrioritySelector
        priority={priority}
        onChange={setPriority}
        criticalAutoNotice={criticalNotice}
      />

      {/* Tags Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-brand-primary">
            Keywords & Tags (Optional)
          </label>
          <span className="text-[11px] text-brand-secondary">
            Comma separated tags for quick indexing
          </span>
        </div>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. vpn, macos, eduroam, outlook, password"
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-app-background border border-brand-secondary/40 rounded-xl text-brand-primary placeholder:text-brand-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-primary transition-colors"
        />
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-brand-primary/10">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl border border-brand-primary/20 bg-app-background text-brand-primary hover:bg-brand-secondary/15 font-medium text-xs sm:text-sm transition-colors inline-flex items-center gap-1.5"
        >
          <i className="bi bi-arrow-left text-xs" />
          <span>Back to Description</span>
        </button>

        <button
          type="button"
          disabled={!isValid}
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-xs sm:text-sm shadow-subtle transition-all inline-flex items-center gap-2 disabled:opacity-50"
        >
          <span>Continue to Review</span>
          <i className="bi bi-arrow-right text-xs" />
        </button>
      </div>
    </div>
  );
};
