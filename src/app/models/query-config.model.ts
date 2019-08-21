export interface QueryConfig {
  fields: { fieldName: string, order: 'desc' | 'asc' }[];
  limit: number;
  after?: any[];
}