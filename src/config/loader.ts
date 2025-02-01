import { Env } from 'src/common/enums';

export const util = {
  isObject<T>(value: T): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  },
  merge(
    target: Record<string, any>,
    source: Record<string, any>,
  ): Record<string, unknown> {
    Object.keys(source).forEach((key: string) => {
      if (this.isObject(target[key]) && this.isObject(source[key])) {
        Object.assign(source[key], this.merge(target[key], source[key]));
      }
    });

    return { ...target, ...source };
  },
};

const getEnvLoaderFile = (env: Env) => {
  switch (env) {
    case Env.Development:
      return 'development';
    case Env.Test:
      return 'test';
    case Env.Production:
      return 'production';
  }
};

export const configuration = async (): Promise<Record<string, unknown>> => {
  const envLoaderFile = getEnvLoaderFile(
    (process.env.NODE_ENV as Env) || Env.Development,
  );
  const envConfig = await import(`./${envLoaderFile}`);
  const common = await import(`./default`);

  // object deep merge
  return util.merge(common.config, envConfig.config);
};
