import { getBullConfig } from './redis.config';

describe('getBullConfig', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it('permite Redis sem senha em desenvolvimento', () => {
    process.env = {
      ...originalEnv,
      MODE: 'DEV',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '',
    };

    expect(getBullConfig()).toMatchObject({
      connection: { host: 'localhost', port: 6379, password: undefined },
    });
  });

  it('exige senha do Redis em produção', () => {
    process.env = {
      ...originalEnv,
      MODE: 'PROD',
      REDIS_HOST: 'redis.internal',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '',
    };

    expect(() => getBullConfig()).toThrow(
      'REDIS_PASSWORD deve ser configurado em produção',
    );
  });

  it('configura senha e TLS em produção', () => {
    process.env = {
      ...originalEnv,
      MODE: 'PROD',
      REDIS_HOST: 'redis.internal',
      REDIS_PORT: '6380',
      REDIS_PASSWORD: 'secret',
      REDIS_TLS: 'true',
    };

    expect(getBullConfig()).toMatchObject({
      connection: {
        host: 'redis.internal',
        port: 6380,
        password: 'secret',
        tls: {},
      },
    });
  });
});
