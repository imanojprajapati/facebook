import { useState, useMemo } from 'react';

interface PaginationOptions {
  totalItems: number;
  pageSize: number;
  maxPages?: number;
}

export function usePagination({ totalItems, pageSize, maxPages = 5 }: PaginationOptions) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(totalItems / pageSize);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }, [currentPage, totalPages, maxPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return { start, end };
  }, [currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    pageNumbers,
    totalPages,
    pageItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}