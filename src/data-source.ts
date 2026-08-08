import { DataSource, type DataSourceOptions } from 'typeorm';
import { configService } from './infra/config/config.service';

export default new DataSource(
  configService.getTypeOrmConfig() as DataSourceOptions,
);
