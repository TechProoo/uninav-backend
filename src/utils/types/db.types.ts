import * as schema from 'src/modules/drizzle/schema/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { InferSelectModel } from 'drizzle-orm';
// Tables
import { user } from 'src/modules/drizzle/schema/user.schema';
import { moderator } from 'src/modules/drizzle/schema/moderator.schema';
import { faculty } from 'src/modules/drizzle/schema/faculty.schema';
import { department } from 'src/modules/drizzle/schema/department.schema';
import { courses } from 'src/modules/drizzle/schema/course.schema';
import { material } from 'src/modules/drizzle/schema/material.schema';
import { collection } from 'src/modules/drizzle/schema/collection.schema';
import { blogs } from 'src/modules/drizzle/schema/blog.schema';
import { comments } from 'src/modules/drizzle/schema/comments.schema';
import { advert } from 'src/modules/drizzle/schema/advert.schema';
export type DrizzleDB = NodePgDatabase<typeof schema>;

export type UserEntity = InferSelectModel<typeof user>;
export type ModeratorEntity = InferSelectModel<typeof moderator>;
export type FacultyEntity = InferSelectModel<typeof faculty>;
export type DepartmentEntity = InferSelectModel<typeof department>;
export type CourseEntity = InferSelectModel<typeof courses>;
export type MaterialEntity = InferSelectModel<typeof material>;
export type CollectionEntity = InferSelectModel<typeof collection>;
export type BlogEntity = InferSelectModel<typeof blogs>;
export type CommentEntity = InferSelectModel<typeof comments>;
export type AdvertEntity = InferSelectModel<typeof advert>;

export enum UserRoleEnum {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  STUDENT = 'student',
}

export enum EntityStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
export enum VisibilityEnum {
  PUBLIC = 'public',
  PRIVATE = 'private',
}
export enum RestrictionEnum {
  READONLY = 'readonly',
  DOWNLOADABLE = 'downloadable',
}
export enum AdvertTypeEnum {
  FREE = 'free',
  PAID = 'paid',
}
export enum BlogTypeEnum {
  ARTICLE = 'article',
  GUIDELINE = 'guideline',
  SCHEME_OF_WORK = 'scheme_of_work',
  TUTORIAL = 'tutorial',
}
