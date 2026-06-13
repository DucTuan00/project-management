import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { env, paths } from '@/config/env';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  synchronize: false,
  logging: env.NODE_ENV === 'development',
  entities: [paths.src + '/modules/**/*.entity.ts'],
  migrations: [paths.migrations + '/**/*.ts'],
  subscribers: [],
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
