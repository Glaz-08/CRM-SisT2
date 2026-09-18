import { IsObject, IsString } from 'class-validator';

export class InboundEventDto {
  @IsString()
  source: string;

  @IsString()
  type: string;

  @IsObject()
  payload: Record<string, unknown>;
}
