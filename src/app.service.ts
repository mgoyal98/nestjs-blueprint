import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeyPair } from 'e2ee-adapter';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getKeys() {
    const serverKeys =
      this.configService.get<Record<string, KeyPair>>('e2ee.keys');
    const publicKeys: Record<string, string> = {};

    Object.keys(serverKeys).forEach((domain) => {
      publicKeys[domain] = serverKeys[domain].publicKey;
    });

    return {
      keys: publicKeys,
      keySize: 2048,
    };
  }
}
