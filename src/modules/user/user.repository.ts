import { Inject, Injectable } from '@nestjs/common';
import { users } from 'src/modules/drizzle/schema/user.schema';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB } from 'src/utils/types/db.types';
import { eq, or, and, inArray, isNull } from 'drizzle-orm';
import { userCourses, bookmarks } from 'src/modules/drizzle/schema/user.schema';
import { AddBookmarkDto } from './dto/bookmark.dto';

@Injectable()
export class UserRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(createUserDto: CreateUserDto) {
    const createdUser = await this.db
      .insert(users)
      .values([createUserDto])
      .returning();
    return createdUser[0];
  }

  async findById(id: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.id, id),
      with: {
        department: true,
      },
    });
  }
  async getProfile(id: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.id, id),
      with: {
        department: true,
        auth: true,
        courses: {
          with: {
            course: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.email, email),
    });
  }

  async findByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: (user, { eq }) => eq(user.username, username),
    });
  }

  async findByEmailOrUsername(emailOrUsername: string) {
    return this.db.query.users.findFirst({
      where: (userTable, { or, eq }) =>
        or(
          eq(userTable.email, emailOrUsername),
          eq(userTable.username, emailOrUsername),
        ),
    });
  }

  async findAll() {
    return this.db.query.users.findMany({
      with: {
        department: true,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const updatedUser = await this.db
      .update(users)
      .set({ ...updateUserDto, updatedAt: new Date() } as any)
      .where(eq(users.id, id))
      .returning();

    return updatedUser[0];
  }

  async remove(id: string) {
    const deletedUser = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return deletedUser[0];
  }

  async addUserCourses(userId: string, courseIds: string[]) {
    const values = courseIds.map((courseId) => ({
      userId,
      courseId,
    }));

    const result = await this.db
      .insert(userCourses)
      .values(values)
      .onConflictDoNothing()
      .returning();

    return result;
  }

  async removeUserCourses(userId: string, courseIds: string[]) {
    const result = await this.db
      .delete(userCourses)
      .where(
        and(
          eq(userCourses.userId, userId),
          inArray(userCourses.courseId, courseIds),
        ),
      )
      .returning();

    return result;
  }

  async deleteAllUserCourses(userId: string) {
    return this.db
      .delete(userCourses)
      .where(eq(userCourses.userId, userId))
      .returning();
  }

  async getUserCourses(userId: string) {
    return this.db.query.userCourses.findMany({
      where: eq(userCourses.userId, userId),
      with: {
        course: true,
      },
    });
  }

  async addBookmark(userId: string, bookmarkDto: AddBookmarkDto) {
    const bookmark = await this.db
      .insert(bookmarks)
      .values({
        userId,
        ...bookmarkDto,
      } as any)
      .returning();

    return bookmark[0];
  }

  async findBookmarkById(bookmarkId: string) {
    return this.db.query.bookmarks.findFirst({
      where: (bookmark) => eq(bookmark.id, bookmarkId),
      with: {
        material: true,
        collection: true,
      },
    });
  }

  async removeBookmark(bookmarkId: string) {
    const removed = await this.db
      .delete(bookmarks)
      .where(eq(bookmarks.id, bookmarkId))
      .returning();

    return removed[0];
  }

  async getUserBookmarks(userId: string) {
    return this.db.query.bookmarks.findMany({
      where: eq(bookmarks.userId, userId),
      with: {
        material: {
          with: {
            creator: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                level: true,
                departmentId: true,
              },
            },
          },
        },
        collection: true,
      },
    });
  }

  async findBookmarkByMaterial(userId: string, materialId: string) {
    return this.db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.materialId, materialId),
      ),
    });
  }

  async findBookmarkByCollection(userId: string, collectionId: string) {
    return this.db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.collectionId, collectionId),
      ),
    });
  }

  async findBookmark(userId: string, materialId: string) {
    return this.db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.materialId, materialId),
      ),
    });
  }
}
