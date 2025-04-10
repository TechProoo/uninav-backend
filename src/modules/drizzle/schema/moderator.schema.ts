import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { approvalStatusEnum } from './enums.schema';
import { users } from './user.schema';
import { department } from './department.schema';
import { faculty } from './faculty.schema';
import { material } from './material.schema';
import { TABLES } from '../tables.constants';

export const moderator = pgTable(TABLES.MODERATOR, {
  userId: uuid('userId')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  departmentId: uuid('department').references(() => department.id, {
    onDelete: 'set null',
  }),

  reviewStatus: approvalStatusEnum('review_status').default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => moderator.userId, {
    onDelete: 'set null',
  }),
});

export const moderatorRelations = relations(moderator, ({ one, many }) => ({
  user: one(users, {
    fields: [moderator.userId],
    references: [users.id],
  }),
  department: one(department, {
    fields: [moderator.departmentId],
    references: [department.id],
  }),

  reviewedMaterials: many(material, { relationName: 'reviewer' }),
}));
