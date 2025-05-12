'use client';

import { useState } from 'react';
import type { FacebookPage } from '@/types/facebook';

interface PageCardProps {
  page: FacebookPage;
}

export function PageCard({ page }: PageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {page.picture?.data?.url && (
          <img
            src={page.picture.data.url}
            alt=""
            className="w-12 h-12 rounded-lg flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 truncate">{page.name}</h3>
            {page.verification_status === 'verified' && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-500">{page.category}</p>
          
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <span>{page.fan_count?.toLocaleString() || 0} fans</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-2 text-sm">
              {page.link && (
                <a
                  href={page.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 block"
                >
                  View on Facebook
                </a>
              )}
              <div className="flex flex-wrap gap-2">
                {page.tasks.map((task, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                  >
                    {task}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}