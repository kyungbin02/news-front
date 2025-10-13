'use client';

import React, { useState } from 'react';

interface SourceFilterProps {
  selectedSources: string[];
  onSourceChange: (sources: string[]) => void;
}

const SOURCE_FILTERS = [
  { id: '동아일보', label: '동아일보', category: '종합', color: 'bg-blue-100 text-blue-800' },
  { id: '조선일보', label: '조선일보', category: '종합', color: 'bg-red-100 text-red-800' },
  { id: '중앙일보', label: '중앙일보', category: '종합', color: 'bg-green-100 text-green-800' },
  { id: '경향신문', label: '경향신문', category: '종합', color: 'bg-purple-100 text-purple-800' },
  { id: '연합뉴스', label: '연합뉴스', category: '종합', color: 'bg-orange-100 text-orange-800' },
  { id: '매일경제', label: '매일경제', category: '경제', color: 'bg-yellow-100 text-yellow-800' },
  { id: '한국경제', label: '한국경제', category: '경제', color: 'bg-indigo-100 text-indigo-800' },
  { id: '전자신문', label: '전자신문', category: 'IT', color: 'bg-teal-100 text-teal-800' },
  { id: '오마이뉴스', label: '오마이뉴스', category: '사회', color: 'bg-pink-100 text-pink-800' }
];

export default function SourceFilter({ selectedSources = [], onSourceChange }: SourceFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSourceToggle = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      onSourceChange(selectedSources.filter(id => id !== sourceId));
    } else {
      onSourceChange([...selectedSources, sourceId]);
    }
  };

  const handleSelectAll = () => {
    onSourceChange(SOURCE_FILTERS.map(filter => filter.id));
  };

  const handleClearAll = () => {
    onSourceChange([]);
  };

  const selectedCount = selectedSources.length;
  const totalCount = SOURCE_FILTERS.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">언론사 필터</h3>
          <span className="text-sm text-gray-500">
            {selectedCount > 0 ? `${selectedCount}개 선택됨` : '전체'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
          >
            전체 선택
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
          >
            전체 해제
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {SOURCE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleSourceToggle(filter.id)}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                  selectedSources.includes(filter.id)
                    ? `${filter.color} border-current`
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{filter.label}</span>
                  <span className="text-xs text-gray-500">{filter.category}</span>
                </div>
                {selectedSources.includes(filter.id) && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>선택된 언론사: {selectedCount}개</span>
              <span>전체 언론사: {totalCount}개</span>
            </div>
          </div>
        </div>
      )}

      {/* 선택된 언론사 미리보기 */}
      {selectedCount > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-1">
          {selectedSources.slice(0, 3).map((sourceId) => {
            const filter = SOURCE_FILTERS.find(f => f.id === sourceId);
            return filter ? (
              <span
                key={sourceId}
                className={`px-2 py-1 text-xs font-medium rounded-full ${filter.color}`}
              >
                {filter.label}
              </span>
            ) : null;
          })}
          {selectedCount > 3 && (
            <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
              +{selectedCount - 3}개 더
            </span>
          )}
        </div>
      )}
    </div>
  );
}
