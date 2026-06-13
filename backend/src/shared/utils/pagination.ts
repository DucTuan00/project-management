import { FindManyOptions, ObjectLiteral } from 'typeorm';
import { PaginationQuery } from '@/shared/dto/pagination.dto';

export function buildPaginationOptions<T extends ObjectLiteral>(
  query: PaginationQuery,
  allowedSortFields: string[] = [],
  defaultSortField: string = 'createdAt',
): FindManyOptions<T> {
  const { page, limit, sortBy, sortOrder, search } = query;
  const skip = (page - 1) * limit;

  const sortField = sortBy && allowedSortFields.includes(sortBy) ? sortBy : defaultSortField;

  return {
    skip,
    take: limit,
    order: {
      [sortField]: sortOrder,
    } as any,
  };
}

export function calculatePagination(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
