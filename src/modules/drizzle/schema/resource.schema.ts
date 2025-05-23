import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { material } from 'src/modules/drizzle/schema/material.schema';
import { resourceTypeEnum } from 'src/modules/drizzle/schema/enums.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { TABLES } from '../tables.constants';

export const resource = pgTable(TABLES.RESOURCE, {
  materialId: uuid('materialId')
    .primaryKey()
    .references(() => material.id, {
      onDelete: 'cascade',
    }),

  resourceAddress: text('resourceAddress').notNull(),
  resourceType: resourceTypeEnum('resourceType').notNull(),
  fileKey: text('fileKey'),
  metaData: text('metaData').array(),

  ...timestamps,
});

export const resourceRelation = relations(resource, ({ one }) => ({
  material: one(material, {
    fields: [resource.materialId],
    references: [material.id],
  }),
}));
