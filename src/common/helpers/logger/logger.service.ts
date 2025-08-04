import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContextKey } from 'src/common/enums';
import { v4 as uuidv4 } from 'uuid';
import * as chalk from 'chalk';
import { ClsService } from 'nestjs-cls';
import * as winston from 'winston';
import { trace } from '@opentelemetry/api';

@Injectable()
export class AppLoggerService implements LoggerService {
  private winstonLogger: winston.Logger;
  private piiConfig: {
    enabled: boolean;
    keys: string[];
    mask: string;
  };

  constructor(
    private config: ConfigService,
    private cls: ClsService,
  ) {
    this.piiConfig = this.config.get('logger.pii');
    let transportOptions = {};
    if (this.config.get<boolean>('logger.colorify')) {
      transportOptions = {
        format: winston.format.printf((info) => this.getColoredLog(info)),
      };
    }
    this.winstonLogger = winston.createLogger({
      level: this.config.get<boolean>('logger.debug') ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: () => Date.now().toString() }),
        winston.format.json(),
        this.getLogAdditionalData(),
      ),
      transports: [new winston.transports.Console(transportOptions)],
    });
  }

  private redactPiiData(data: any): any {
    if (!this.piiConfig?.enabled) {
      return data;
    }

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.redactPiiData(item));
    }

    const redactedData = JSON.parse(JSON.stringify(data));
    for (const key in redactedData) {
      const lowerKey = key.toLowerCase();
      if (
        this.piiConfig.keys.some((piiKey) =>
          lowerKey.includes(piiKey.toLowerCase()),
        )
      ) {
        redactedData[key] = this.piiConfig.mask;
      } else if (
        typeof redactedData[key] === 'object' &&
        redactedData[key] !== null
      ) {
        redactedData[key] = this.redactPiiData(redactedData[key]);
      }
    }
    return redactedData;
  }

  private getLogAdditionalData = winston.format((info) => {
    const span = trace.getActiveSpan();
    return {
      ...info,
      application: this.config.get('app.name'),
      environment: this.config.get('app.env'),
      userId: this.cls.get(ContextKey.USER_ID) || '',
      correlationId:
        this.cls.get<string>(ContextKey.CORRELATION_ID) ||
        `${this.config.get('app.name')}-${uuidv4()}`,
      trace_id: span?.spanContext()?.traceId || '',
      span_id: span?.spanContext()?.spanId || '',
    };
  });

  private parseData(...data: any): Record<string, any> {
    let paramCount = 1;
    let errorCount = 0;
    let parsedData: Record<string, any> = {};

    for (const param of data) {
      const paramName = param?.name ? param?.name : `param-${paramCount}`;
      const errorName = param?.name ? param?.name : `error-${errorCount}`;

      if (param instanceof Error) {
        parsedData = {
          ...parsedData,
          [errorName]: {
            message: param?.message,
            stack: param?.stack,
            name: param?.name,
          },
        };
        errorCount++;
      } else if (Array.isArray(param)) {
        parsedData = { ...parsedData, [paramName]: param };
        paramCount++;
      } else if (typeof param === 'object') {
        parsedData = { ...parsedData, ...param };
      } else {
        parsedData = { ...parsedData, [paramName]: param };
        paramCount++;
      }
    }
    return this.redactPiiData(parsedData);
  }

  private handleLog(level: string, message: string, ...data: any) {
    const parsedData = this.parseData(...data);

    this.handleDelimitter(level);
    this.winstonLogger.log(this.getWinstonLogLevel(level), message, parsedData);
  }

  private handleDelimitter(level: string) {
    if (!this.config.get<boolean>('logger.delimitter')) {
      return;
    }
    if (
      !this.config.get<boolean>('logger.debug') &&
      ['debug', 'log'].includes(level)
    ) {
      return;
    }
    console.log('----------------------------------------');
  }

  private getWinstonLogLevel(level: string) {
    switch (level) {
      case 'info':
        return 'info';
      case 'error':
        return 'error';
      case 'warn':
        return 'warn';
      default:
        return 'debug';
    }
  }

  private getColoredLog(log: Record<string, any>) {
    let coloredLog = '';
    for (const key in log) {
      let value = log[key];
      switch (key) {
        case 'level':
          value = this.getColoredLogLevel(value);
          break;
        case 'timestamp':
          value = chalk.blue(value);
          break;
        case 'message':
          value = chalk.white(value);
          break;
        default:
          value = JSON.stringify(value);
          break;
      }
      coloredLog += `${chalk.magenta.bold(key)} ${value} `;
    }
    return coloredLog;
  }

  private getColoredLogLevel(level: string) {
    level = ` ${level.toUpperCase()} `;
    switch (level) {
      case ' INFO ':
        level = chalk.bgCyan.black(level);
        break;
      case ' ERROR ':
        level = chalk.bgRed.black(level);
        break;
      case ' DEBUG ':
        level = chalk.bgGreen.black(level);
        break;
      case ' WARN ':
        level = chalk.bgYellow.black(level);
        break;
      default:
        level = chalk.bgWhite.black(level);
        break;
    }
    return chalk.bold(level);
  }

  info(message: string, ...data: any) {
    this.handleLog('info', message, ...data);
  }

  error(message: string, ...data: any) {
    this.handleLog('error', message, ...data);
  }

  debug(message: string, ...data: any) {
    this.handleLog('debug', message, ...data);
  }

  log(message: string, ...data: any) {
    this.handleLog('log', message, ...data);
  }

  warn(message: string, ...data: any) {
    this.handleLog('warn', message, ...data);
  }
}
