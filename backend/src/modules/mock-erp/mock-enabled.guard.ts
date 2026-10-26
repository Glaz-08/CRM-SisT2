import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toBoolean } from '../../common/config/env';

/** Oculta los endpoints de mock cuando `ENABLE_MOCKS=false`. */
@Injectable()
export class MockEnabledGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(): boolean {
    if (!toBoolean(this.config.get<string>('ENABLE_MOCKS'), false)) {
      throw new NotFoundException();
    }
    return true;
  }
}
