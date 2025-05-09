'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { FaUsers, FaCheckCircle, FaExternalLinkAlt, FaSpinner } from 'react-icons/fa';
import type { FacebookPage, LeadResponse } from '@/types/facebook';
import { LoadingSpinner } from './LoadingSpinner';
import { LazyLoad } from './LazyLoad';

interface PageCardProps {
  page: FacebookPage;
  leads?: LeadResponse;
  loadingLeads: boolean;
  onLoadLeads: (pageId: string, pageToken: string) => void;
  isSelected?: boolean;
}

export function PageCard({
  page,
  leads,
  loadingLeads,
  onLoadLeads,
  isSelected = false
}: PageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLoadLeads = useCallback(() => {
    if (!leads && !loadingLeads) {
      onLoadLeads(page.id, page.access_token);
    }
    setIsExpanded(true);
  }, [page, leads, loadingLeads, onLoadLeads]);

  return (
    <LazyLoad
      threshold={0.1}
      rootMargin="50px"
      placeholder={
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      }
    >
      <article
        role="article"
        tabIndex={0}
        className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-200 ${
          isSelected ? 'ring-2 ring-facebook ring-offset-2' : ''
        }`}
      >
        <div className="relative">
          {page.picture?.data?.url && (
            <Image
              src={page.picture.data.url}
              alt={page.name}
              width={400}
              height={200}
              className="w-full h-32 object-cover"
              priority={false}
            />
          )}
          {page.verification_status === 'verified' && (
            <div className="absolute top-2 right-2 bg-white rounded-full p-1">
              <FaCheckCircle className="text-facebook" />
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold truncate">{page.name}</h2>
            <a
              href={page.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-facebook transition-colors"
            >
              <FaExternalLinkAlt />
            </a>
          </div>

          <div className="mt-2 flex items-center gap-2 text-gray-600">
            <FaUsers />
            <span>{page.fan_count?.toLocaleString() || 0} followers</span>
          </div>

          <div className="mt-4">
            <button
              onClick={handleLoadLeads}
              className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 ${
                isExpanded
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-facebook hover:bg-facebook-hover text-white'
              }`}
              disabled={loadingLeads}
            >
              {loadingLeads ? (
                <div className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  <span>Loading leads...</span>
                </div>
              ) : (
                <span>{isExpanded ? 'Hide leads' : 'View leads'}</span>
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-4">
              {loadingLeads ? (
                <LoadingSpinner size="md" />
              ) : leads ? (
                leads.error ? (
                  <div className="text-red-500 text-sm">{leads.error}</div>
                ) : (
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      Recent Leads ({leads.leads.length})
                    </h3>
                    <div className="max-h-60 overflow-y-auto">
                      {leads.leads.map((lead) => (
                        <div
                          key={lead.id}
                          className="p-2 bg-gray-50 rounded text-sm mb-2"
                        >
                          <div className="text-gray-500 text-xs">
                            {new Date(lead.created_time).toLocaleDateString()}
                          </div>
                          {lead.field_data.map((field) => (
                            <div key={field.name} className="mt-1">
                              <span className="font-medium">{field.name}:</span>{' '}
                              {field.values.join(', ')}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : null}
            </div>
          )}
        </div>
      </article>
    </LazyLoad>
  );
}