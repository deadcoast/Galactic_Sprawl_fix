import {
  AlertTriangle,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  FolderTree,
  Search,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useClassification } from '../../contexts/ClassificationContext';
import {
  ClassifiableDiscovery,
  Classification,
  ClassificationSuggestion,
  ConfidenceLevel,
} from '../../types/exploration/ClassificationTypes';

interface DiscoveryClassificationProps {
  discovery: ClassifiableDiscovery;
  onClassify?: (classification: Classification) => void;
  className?: string;
  compact?: boolean;
}

export function DiscoveryClassification({
  discovery,
  onClassify,
  className = '',
  compact = false,
}: DiscoveryClassificationProps) {
  const {
    taxonomyCategories,
    addClassification,
    getClassificationsForDiscovery,
    getTaxonomyCategory,
    generateClassificationSuggestions,
    getSimilarDiscoveries,
  } = useClassification();

  // State for the classification form
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0.7);
  const [notes, setNotes] = useState<string>('');
  const [propertyValues, setPropertyValues] = useState<
    Record<string, string | number | boolean | string[]>
  >({});

  // State for UI
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  const [showSimilarDiscoveries, setShowSimilarDiscoveries] = useState<boolean>(false);
  const [showTaxonomyBrowser, setShowTaxonomyBrowser] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'classify' | 'history' | 'similar'>('classify');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Get existing classifications for this discovery
  const existingClassifications = useMemo(
    () => getClassificationsForDiscovery(discovery.id),
    [getClassificationsForDiscovery, discovery.id]
  );

  // Generate AI suggestions
  const [suggestions, setSuggestions] = useState<ClassificationSuggestion[]>([]);

  useEffect(() => {
    // Generate suggestions when the component mounts
    setSuggestions(generateClassificationSuggestions(discovery));
  }, [discovery, generateClassificationSuggestions]);

  // Get similar discoveries
  const similarDiscoveries = useMemo(
    () => getSimilarDiscoveries(discovery.id),
    [getSimilarDiscoveries, discovery.id]
  );

  // Filter taxonomy categories based on discovery type and search query
  const filteredCategories = useMemo(() => {
    const rootCategoryId = discovery.type === 'anomaly' ? 'anomaly-root' : 'resource-root';

    return taxonomyCategories.filter(category => {
      // Filter by discovery type
      const isCorrectType =
        category.id === rootCategoryId ||
        taxonomyCategories.some(
          c =>
            c.id === category.parentId && (c.id === rootCategoryId || c.parentId === rootCategoryId)
        );

      // Filter by search query if provided
      const matchesSearch = searchQuery
        ? category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.description.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      return isCorrectType && matchesSearch;
    });
  }, [taxonomyCategories, discovery.type, searchQuery]);

  // Get properties for the selected category
  const selectedCategoryProperties = useMemo(() => {
    const category = getTaxonomyCategory(selectedCategoryId);
    return category?.properties || [];
  }, [getTaxonomyCategory, selectedCategoryId]);

  // Handle property value changes
  const handlePropertyChange = (
    propertyId: string,
    value: string | number | boolean | string[]
  ) => {
    setPropertyValues(prev => ({
      ...prev,
      [propertyId]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate processing
    setIsProcessing(true);

    setTimeout(() => {
      // Create the classification object
      const newClassification: Omit<Classification, 'id'> = {
        discoveryId: discovery.id,
        discoveryType: discovery.type,
        categoryId: selectedCategoryId,
        confidence,
        confidenceLevel: getConfidenceLevelFromScore(confidence),
        properties: propertyValues,
        notes,
        classifiedBy: 'user',
        classifiedDate: Date.now(),
        previousClassifications: existingClassifications.map(c => c.id),
      };

      // Add the classification
      addClassification(newClassification);

      // Call the onClassify callback if provided
      if (onClassify) {
        onClassify({
          ...newClassification,
          id: 'temp-id', // This will be replaced by the actual ID in the context
        });
      }

      // Reset the form
      setSelectedCategoryId('');
      setConfidence(0.7);
      setNotes('');
      setPropertyValues({});
      setIsProcessing(false);
    }, 1000);
  };

  // Apply a suggestion
  const applySuggestion = (suggestion: ClassificationSuggestion) => {
    setSelectedCategoryId(suggestion.categoryId);
    setConfidence(suggestion.confidence);
    setPropertyValues(suggestion.propertyValues);
  };

  // Helper function to get confidence level from score
  const getConfidenceLevelFromScore = (score: number): ConfidenceLevel => {
    if (score >= 0.9) return 'confirmed';
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  };

  // Helper function to get color for confidence level
  const getConfidenceColor = (level: ConfidenceLevel): string => {
    switch (level) {
      case 'confirmed':
        return 'text-green-500';
      case 'high':
        return 'text-blue-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Render the category hierarchy
  const renderCategoryHierarchy = (categoryId: string, level = 0) => {
    const category = getTaxonomyCategory(categoryId);
    if (!category) return null;

    // Find child categories
    const children = taxonomyCategories.filter(c => c.parentId === categoryId);

    return (
      <div key={categoryId} className="mb-1">
        <div
          className={`flex cursor-pointer items-center rounded p-2 ${
            selectedCategoryId === categoryId
              ? 'bg-blue-100 dark:bg-blue-900'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          style={{ marginLeft: `${level * 16}px` }}
          onClick={() => setSelectedCategoryId(categoryId)}
        >
          <div
            className="mr-2 h-3 w-3 rounded-full"
            style={{ backgroundColor: category.color || '#6b7280' }}
          ></div>
          <span>{category.name}</span>
        </div>
        {children.map(child => renderCategoryHierarchy(child.id, level + 1))}
      </div>
    );
  };

  // Render the compact version
  if (compact) {
    return (
      <div className={`rounded-lg border p-4 shadow-sm ${className}`}>
        <h3 className="mb-2 text-lg font-semibold">Classification</h3>

        {existingClassifications.length > 0 ? (
          <div>
            {existingClassifications.map(classification => {
              const category = getTaxonomyCategory(classification.categoryId);
              return (
                <div
                  key={classification.id}
                  className="mb-2 rounded bg-gray-50 p-2 dark:bg-gray-800"
                >
                  <div className="flex items-center">
                    <div
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: category?.color || '#6b7280' }}
                    ></div>
                    <span className="font-medium">{category?.name || 'Unknown Category'}</span>
                    <span
                      className={`ml-2 text-xs ${getConfidenceColor(classification.confidenceLevel)}`}
                    >
                      {classification.confidenceLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No classifications yet. Click to classify.
          </div>
        )}
      </div>
    );
  }

  // Render the full version
  return (
    <div className={`rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold">Discovery Classification</h2>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Classify and categorize discoveries for better organization and analysis
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'classify'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('classify')}
        >
          Classify
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('history')}
        >
          History ({existingClassifications.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'similar'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('similar')}
        >
          Similar ({similarDiscoveries.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'classify' && (
          <div>
            {/* Discovery Info */}
            <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div className="mb-2 flex items-center">
                <div className="mr-2">
                  {discovery.type === 'anomaly' ? (
                    <AlertTriangle className="text-yellow-500" size={20} />
                  ) : (
                    <Database className="text-blue-500" size={20} />
                  )}
                </div>
                <h3 className="text-lg font-medium">{discovery.name}</h3>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <div>
                  Type:{' '}
                  {discovery.type === 'anomaly'
                    ? `Anomaly (${discovery.anomalyType})`
                    : `Resource (${discovery.resourceType})`}
                </div>
                <div>Sector: {discovery.sectorName}</div>
                <div>Discovered: {new Date(discovery.discoveryDate).toLocaleDateString()}</div>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="mb-4">
              <div
                className="flex cursor-pointer items-center justify-between rounded-t-lg bg-blue-50 p-2 dark:bg-blue-900"
                onClick={() => setShowSuggestions(!showSuggestions)}
              >
                <div className="flex items-center">
                  <Brain size={18} className="mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">AI Classification Suggestions</span>
                </div>
                {showSuggestions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {showSuggestions && (
                <div className="rounded-b-lg border border-t-0 p-3">
                  {suggestions.length > 0 ? (
                    <div>
                      {suggestions.map((suggestion, index) => {
                        const category = getTaxonomyCategory(suggestion.categoryId);
                        const confidenceLevel = getConfidenceLevelFromScore(suggestion.confidence);

                        return (
                          <div
                            key={index}
                            className="mb-2 cursor-pointer rounded border p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => applySuggestion(suggestion)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div
                                  className="mr-2 h-3 w-3 rounded-full"
                                  style={{ backgroundColor: category?.color || '#6b7280' }}
                                ></div>
                                <span className="font-medium">
                                  {category?.name || 'Unknown Category'}
                                </span>
                              </div>
                              <span className={`text-sm ${getConfidenceColor(confidenceLevel)}`}>
                                {Math.round(suggestion.confidence * 100)}% confidence
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {suggestion.reasoning}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No suggestions available. Try providing more information about the discovery.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Classification Form */}
            <form onSubmit={handleSubmit}>
              {/* Taxonomy Browser */}
              <div className="mb-4">
                <div
                  className="flex cursor-pointer items-center justify-between rounded-t-lg bg-gray-100 p-2 dark:bg-gray-700"
                  onClick={() => setShowTaxonomyBrowser(!showTaxonomyBrowser)}
                >
                  <div className="flex items-center">
                    <FolderTree size={18} className="mr-2" />
                    <span className="font-medium">Taxonomy Browser</span>
                  </div>
                  {showTaxonomyBrowser ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {showTaxonomyBrowser && (
                  <div className="rounded-b-lg border border-t-0 p-3">
                    <div className="mb-3">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Search categories..."
                          className="w-full rounded border py-2 pl-10 pr-4"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                      {discovery.type === 'anomaly'
                        ? renderCategoryHierarchy('anomaly-root')
                        : renderCategoryHierarchy('resource-root')}
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Category */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">Selected Category</label>
                {selectedCategoryId ? (
                  <div className="flex items-center rounded border p-2">
                    <div
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{
                        backgroundColor:
                          getTaxonomyCategory(selectedCategoryId)?.color || '#6b7280',
                      }}
                    ></div>
                    <span>
                      {getTaxonomyCategory(selectedCategoryId)?.name || 'Unknown Category'}
                    </span>
                    <button
                      type="button"
                      className="ml-auto text-gray-400 hover:text-gray-600"
                      onClick={() => setSelectedCategoryId('')}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="rounded border p-2 text-gray-500 dark:text-gray-400">
                    No category selected. Use the taxonomy browser or AI suggestions to select a
                    category.
                  </div>
                )}
              </div>

              {/* Confidence Slider */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">
                  Classification Confidence: {Math.round(confidence * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={confidence}
                  onChange={e => setConfidence(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Confirmed</span>
                </div>
              </div>

              {/* Category Properties */}
              {selectedCategoryProperties.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium">Category Properties</h4>
                  {selectedCategoryProperties.map(property => (
                    <div key={property.id} className="mb-3">
                      <label className="mb-1 block text-sm font-medium">
                        {property.name}
                        {property.required && <span className="ml-1 text-red-500">*</span>}
                      </label>
                      {property.type === 'string' && (
                        <input
                          type="text"
                          className="w-full rounded border p-2"
                          value={(propertyValues[property.id] as string) || ''}
                          onChange={e => handlePropertyChange(property.id, e.target.value)}
                          required={property.required}
                        />
                      )}
                      {property.type === 'number' && (
                        <input
                          type="number"
                          className="w-full rounded border p-2"
                          value={(propertyValues[property.id] as number) || ''}
                          onChange={e =>
                            handlePropertyChange(property.id, parseFloat(e.target.value))
                          }
                          required={property.required}
                        />
                      )}
                      {property.type === 'boolean' && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={(propertyValues[property.id] as boolean) || false}
                            onChange={e => handlePropertyChange(property.id, e.target.checked)}
                            required={property.required}
                          />
                          <span className="text-sm">Yes</span>
                        </div>
                      )}
                      {property.type === 'enum' && property.options && (
                        <select
                          className="w-full rounded border p-2"
                          value={(propertyValues[property.id] as string) || ''}
                          onChange={e => handlePropertyChange(property.id, e.target.value)}
                          required={property.required}
                        >
                          <option value="">Select an option</option>
                          {property.options.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}
                      {property.description && (
                        <div className="mt-1 text-xs text-gray-500">{property.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea
                  className="w-full rounded border p-2"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this classification..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  disabled={!selectedCategoryId || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 animate-spin">
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"></div>
                      </div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check size={18} className="mr-2" />
                      Classify Discovery
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h3 className="mb-3 text-lg font-medium">Classification History</h3>

            {existingClassifications.length > 0 ? (
              <div>
                {existingClassifications.map(classification => {
                  const category = getTaxonomyCategory(classification.categoryId);

                  return (
                    <div key={classification.id} className="mb-3 rounded border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="mr-2 h-3 w-3 rounded-full"
                            style={{ backgroundColor: category?.color || '#6b7280' }}
                          ></div>
                          <span className="font-medium">
                            {category?.name || 'Unknown Category'}
                          </span>
                        </div>
                        <span
                          className={`text-sm ${getConfidenceColor(classification.confidenceLevel)}`}
                        >
                          {Math.round(classification.confidence * 100)}% confidence
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Classified by: {classification.classifiedBy} on{' '}
                        {new Date(classification.classifiedDate).toLocaleString()}
                      </div>

                      {Object.keys(classification.properties).length > 0 && (
                        <div className="mt-2">
                          <h4 className="mb-1 text-sm font-medium">Properties</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(classification.properties).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {classification.notes && (
                        <div className="mt-2">
                          <h4 className="mb-1 text-sm font-medium">Notes</h4>
                          <div className="text-sm">{classification.notes}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                No classification history available for this discovery.
              </div>
            )}
          </div>
        )}

        {activeTab === 'similar' && (
          <div>
            <h3 className="mb-3 text-lg font-medium">Similar Discoveries</h3>

            {similarDiscoveries.length > 0 ? (
              <div>
                {similarDiscoveries.map(discovery => {
                  const classification = discovery.classification;
                  const category = classification
                    ? getTaxonomyCategory(classification.categoryId)
                    : null;

                  return (
                    <div key={discovery.id} className="mb-3 rounded border p-3">
                      <div className="mb-2 flex items-center">
                        <div className="mr-2">
                          {discovery.type === 'anomaly' ? (
                            <AlertTriangle className="text-yellow-500" size={18} />
                          ) : (
                            <Database className="text-blue-500" size={18} />
                          )}
                        </div>
                        <h4 className="font-medium">{discovery.name}</h4>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          Type:{' '}
                          {discovery.type === 'anomaly'
                            ? `Anomaly (${discovery.anomalyType})`
                            : `Resource (${discovery.resourceType})`}
                        </div>
                        <div>Sector: {discovery.sectorName}</div>
                      </div>

                      {classification && category && (
                        <div className="mt-2 rounded bg-gray-50 p-2 dark:bg-gray-800">
                          <div className="flex items-center">
                            <div
                              className="mr-2 h-3 w-3 rounded-full"
                              style={{ backgroundColor: category.color || '#6b7280' }}
                            ></div>
                            <span className="font-medium">{category.name}</span>
                            <span
                              className={`ml-2 text-xs ${getConfidenceColor(
                                classification.confidenceLevel
                              )}`}
                            >
                              {Math.round(classification.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                No similar discoveries found. Try classifying this discovery first.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
