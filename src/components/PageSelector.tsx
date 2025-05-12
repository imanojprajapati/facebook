'use client';

import { useState } from 'react';
import type { FacebookPage } from '@/types/facebook';
import { LoadingSpinner } from './LoadingSpinner';

interface PageSelectorProps {
  pages: FacebookPage[];
  onPagesSelected: (selectedPages: FacebookPage[]) => void;
  isLoading?: boolean;
}

export function PageSelector({ pages, onPagesSelected, isLoading = false }: PageSelectorProps) {
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  const handlePageToggle = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
    onPagesSelected(pages.filter(page => newSelected.has(page.id)));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Select Pages to Manage</h2>
        <span className="text-sm text-gray-500">
          {selectedPages.size} of {pages.length} selected
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map(page => (
          <div
            key={page.id}
            className={`relative p-4 border rounded-lg transition-all cursor-pointer ${
              selectedPages.has(page.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handlePageToggle(page.id)}
          >
            <div className="flex items-center space-x-3">
              {page.picture?.data?.url && (
                <img
                  src={page.picture.data.url}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{page.name}</p>
                <p className="text-sm text-gray-500 truncate">{page.category}</p>
              </div>
              <input
                type="checkbox"
                checked={selectedPages.has(page.id)}
                onChange={() => handlePageToggle(page.id)}
                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>
            {page.verification_status === 'verified' && (
              <span className="absolute top-2 right-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
