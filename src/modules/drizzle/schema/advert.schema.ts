import { pgTable, uuid, text, numeric, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { advertTypeEnum, approvalStatusEnum } from './enums.schema';
import { material } from './material.schema';
import { collection } from './collection.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { TABLES } from '../tables.constants';

export const advert = pgTable(TABLES.ADVERT, {
  id: uuid('id').primaryKey().defaultRandom(),
  type: advertTypeEnum('type').notNull(),
  amount: numeric('amount').default('0'),
  materialId: uuid('material_id').references(() => material.id, {
    onDelete: 'cascade',
  }),
  collectionId: uuid('collection_id').references(() => collection.id, {
    onDelete: 'cascade',
  }),
  imageUrl: text('image_url').notNull(),
  fileKey: text('file_key').notNull(),
  label: text('label').notNull(),
  description: text('description'),
  clicks: integer('clicks').default(0),
  views: integer('views').default(0),
  reviewStatus: approvalStatusEnum('review_status').default('pending'),
  ...timestamps,
});

export const advertRelations = relations(advert, ({ one }) => ({
  material: one(material, {
    fields: [advert.materialId],
    references: [material.id],
  }),
  collection: one(collection, {
    fields: [advert.collectionId],
    references: [collection.id],
  }),
}));
