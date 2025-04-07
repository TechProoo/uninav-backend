import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BlogTypeEnum } from 'src/utils/types/db.types';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(BlogTypeEnum)
  @IsNotEmpty()
  type: BlogTypeEnum;

  @IsString()
  @IsNotEmpty()
  body: string; // This will be stored in B2 storage, not directly in DB

  @IsArray()
  @IsOptional()
  tags?: string[];

  creatorId: string;
}
