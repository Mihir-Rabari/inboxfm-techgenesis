import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class ConnectIntegrationDto {
  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  tokenExpiry?: Date;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateStyleProfileDto {
  @IsString()
  content: string;
}

export class UpdateRssFeedsDto {
  @IsArray()
  @IsString({ each: true })
  urls: string[];
}
