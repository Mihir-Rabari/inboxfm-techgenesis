import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import {
    DEFAULT_DELIVERY_TIME,
    TIME_FORMAT_REGEX
} from './summary.constants';

export class CreateSummaryDto {
    @IsString()
    name: string;

    @IsString()
    @Matches(TIME_FORMAT_REGEX, {
        message: `Invalid time format. Use HH:MM (e.g., ${DEFAULT_DELIVERY_TIME})`,
    })
    deliveryTime: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    voicePersona?: string;

    @IsOptional()
    @IsString()
    emailsFrom?: string;

    @IsOptional()
    @IsString()
    customPrompt?: string;

    @IsOptional()
    @IsString()
    styleId?: string;

    @IsOptional()
    @IsBoolean()
    includeGmail?: boolean;

    @IsOptional()
    @IsBoolean()
    includeOutlook?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateSummaryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    @Matches(TIME_FORMAT_REGEX, {
        message: `Invalid time format. Use HH:MM (e.g., ${DEFAULT_DELIVERY_TIME})`,
    })
    deliveryTime?: string;

    @IsOptional()
    @IsString()
    timezone?: string;

    @IsOptional()
    @IsString()
    voicePersona?: string;

    @IsOptional()
    @IsString()
    emailsFrom?: string;

    @IsOptional()
    @IsString()
    customPrompt?: string;

    @IsOptional()
    @IsString()
    styleId?: string;

    @IsOptional()
    @IsBoolean()
    includeGmail?: boolean;

    @IsOptional()
    @IsBoolean()
    includeOutlook?: boolean;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
