import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
  customType,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import {
  visibilityEnum,
  restrictionEnum,
  materialTypeEnum,
  approvalStatusEnum,
} from './enums.schema';
import { bookmarks, users } from './user.schema';
import { collectionContent } from './collection.schema';
import { advert } from './advert.schema';
import { resource } from 'src/modules/drizzle/schema/resource.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { courses } from 'src/modules/drizzle/schema/course.schema';
import { TABLES } from '../tables.constants';
import { materialLikes } from './material-likes.schema';
import { tsvector } from 'src/modules/drizzle/schema/custom-type';

export const material = pgTable(
  TABLES.MATERIALS,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: materialTypeEnum('type').notNull(),
    tags: text('tags').array(),
    // statistics
    views: integer('views').default(0),
    downloads: integer('downloads').default(0),
    likes: integer('likes').default(0),

    creatorId: uuid('creator_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    label: text('label'),
    description: text('description'),
    visibility: visibilityEnum('visibility').default('public'),
    restriction: restrictionEnum('restriction').default('readonly'),

    targetCourseId: uuid('target_course').references(() => courses.id, {
      onDelete: 'set null',
    }),
    reviewStatus: approvalStatusEnum('review_status').default('pending'),
    reviewedById: uuid('reviewed_by').references(() => users.id, {
      onDelete: 'set null',
    }),

    searchVector: tsvector('search_vector'),
    ...timestamps,
  },
  (table) => {
    return {
      searchVectorIdx: index('material_search_vector_idx').on(
        table.searchVector,
      ),
    };
  },
);

export const materialRelations = relations(material, ({ one, many }) => ({
  creator: one(users, {
    fields: [material.creatorId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [material.reviewedById],
    references: [users.id],
  }),
  resource: one(resource, {
    fields: [material.id],
    references: [resource.materialId],
  }),
  bookmarks: many(bookmarks),
  collections: many(collectionContent),
  adverts: many(advert),
  targetCourse: one(courses, {
    fields: [material.targetCourseId],
    references: [courses.id],
  }),
  likes: many(materialLikes),
}));
