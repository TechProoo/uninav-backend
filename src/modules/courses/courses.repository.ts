import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import {
  ApprovalStatus,
  CourseEntity,
  DrizzleDB,
} from 'src/utils/types/db.types';
import { userCourses } from 'src/modules/drizzle/schema/user.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { and, eq, or, sql, desc } from 'drizzle-orm';
import {
  courses,
  departmentLevelCourses,
} from '../drizzle/schema/course.schema';

@Injectable()
export class CoursesRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async findExistingDepartmentLevelCourse(
    courseId: string,
    departmentId: string,
    level: number,
  ) {
    return await this.db.query.departmentLevelCourses.findFirst({
      where: and(
        eq(departmentLevelCourses.courseId, courseId),
        eq(departmentLevelCourses.departmentId, departmentId),
        eq(departmentLevelCourses.level, level),
      ),
    });
  }

  async createDepartmentLevelCourse(
    courseId: string,
    departmentId: string,
    level: number,
  ) {
    return await this.db
      .insert(departmentLevelCourses)
      .values({
        departmentId,
        courseId,
        level,
      } as any)
      .returning();
  }

  async create(createCourseDto: CreateCourseDto) {
    const { departmentId, level, ...courseData } = createCourseDto;

    return await this.db.transaction(async (tx) => {
      // Try to find existing course
      const existingCourse = await tx.query.courses.findFirst({
        where: or(
          eq(courses.courseCode, courseData.courseCode),
          eq(courses.courseName, courseData.courseName),
        ),
      });

      let course;
      if (existingCourse) {
        course = existingCourse;
      } else {
        // Create new course if it doesn't exist
        [course] = await tx
          .insert(courses)
          .values(courseData as any)
          .returning();
      }

      // Check if department-level course combination already exists
      const existingDeptLevel = await tx.query.departmentLevelCourses.findFirst(
        {
          where: and(
            eq(departmentLevelCourses.courseId, course.id),
            eq(departmentLevelCourses.departmentId, departmentId),
            eq(departmentLevelCourses.level, level),
          ),
        },
      );

      if (!existingDeptLevel) {
        // Create new department-level course relationship
        await tx.insert(departmentLevelCourses).values({
          departmentId,
          courseId: course.id,
          level,
        } as any);
      } else {
        return null;
      }
      return course;
    });
  }

  async findAll(filters?: {
    departmentId?: string;
    level?: number;
    reviewStatus?: ApprovalStatus;
  }) {
    // Base query to get all courses with department info but without deep nesting
    const baseQuery = this.db
      .select({
        id: courses.id,
        courseName: courses.courseName,
        courseCode: courses.courseCode,
        description: courses.description,
        reviewStatus: courses.reviewStatus,
        departmentId: departmentLevelCourses.departmentId,
        level: departmentLevelCourses.level,
      })
      .from(courses)
      .leftJoin(
        departmentLevelCourses,
        eq(courses.id, departmentLevelCourses.courseId),
      );

    let conditions = [];

    // Apply filters if provided
    if (filters?.departmentId) {
      conditions.push(
        eq(departmentLevelCourses.departmentId, filters.departmentId),
      );
    }
    if (filters?.level) {
      conditions.push(eq(departmentLevelCourses.level, filters.level));
    }
    if (filters?.reviewStatus) {
      conditions.push(eq(courses.reviewStatus, filters.reviewStatus));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get data with filters
    return await baseQuery.where(whereClause).orderBy(desc(courses.createdAt));
  }

  async findAllPaginated(filters?: {
    departmentId?: string;
    level?: number;
    reviewStatus?: ApprovalStatus;
    page?: number;
  }) {
    const limit = 10;
    const page = filters?.page || 1;
    const offset = (page - 1) * limit;

    // Base query to get all courses with department info but without deep nesting
    const baseQuery = this.db
      .select({
        id: courses.id,
        courseName: courses.courseName,
        courseCode: courses.courseCode,
        description: courses.description,
        reviewStatus: courses.reviewStatus,
        departmentId: departmentLevelCourses.departmentId,
        level: departmentLevelCourses.level,
      })
      .from(courses)
      .leftJoin(
        departmentLevelCourses,
        eq(courses.id, departmentLevelCourses.courseId),
      );

    let conditions = [];

    // Apply filters if provided
    if (filters?.departmentId) {
      conditions.push(
        eq(departmentLevelCourses.departmentId, filters.departmentId),
      );
    }
    if (filters?.level) {
      conditions.push(eq(departmentLevelCourses.level, filters.level));
    }
    if (filters?.reviewStatus) {
      conditions.push(eq(courses.reviewStatus, filters.reviewStatus));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .leftJoin(
        departmentLevelCourses,
        eq(courses.id, departmentLevelCourses.courseId),
      )
      .where(whereClause)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated data
    const data = await baseQuery
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(courses.createdAt));

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findById(id: string) {
    // Detailed query with all relations for single course
    return this.db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        departmentCourses: {
          with: {
            department: {
              with: {
                faculty: true,
              },
            },
          },
        },
      },
    });
  }

  async findByCourseCode(courseCode: string) {
    return this.db.query.courses.findFirst({
      where: eq(courses.courseCode, courseCode),
      with: {
        departmentCourses: {
          with: {
            department: {
              with: {
                faculty: true,
              },
            },
          },
        },
      },
    });
  }

  async findByCourseCodeOrName(courseCode: string, courseName: string) {
    return this.db.query.courses.findFirst({
      where: or(
        eq(courses.courseCode, courseCode),
        eq(courses.courseName, courseName),
      ),
    });
  }

  async findCoursesByDepartmentAndLevel(departmentId: string, level: number) {
    const result = await this.db
      .select({
        courseId: departmentLevelCourses.courseId,
      })
      .from(departmentLevelCourses)
      .where(
        and(
          eq(departmentLevelCourses.departmentId, departmentId),
          eq(departmentLevelCourses.level, level),
        ),
      );

    return result;
  }

  async createUserCourses(userId: string, courses: { courseId: string }[]) {
    if (!courses.length) return;

    await this.db.insert(userCourses).values(
      courses.map((course) => ({
        userId,
        courseId: course.courseId,
      })),
    );
  }

  async update(id: string, updateData: Partial<CourseEntity>) {
    const result = await this.db
      .update(courses)
      .set({ ...updateData, updatedAt: new Date() } as any)
      .where(eq(courses.id, id))
      .returning();
    return result[0];
  }

  async reviewDepartmentLevelCourse(
    departmentId: string,
    courseId: string,
    level: number,
    reviewData: {
      reviewStatus: ApprovalStatus;
      reviewedById: string;
    },
  ) {
    const [result] = await this.db
      .update(departmentLevelCourses)
      .set({
        reviewStatus: reviewData.reviewStatus,
        reviewedById: reviewData.reviewedById,
      } as any)
      .where(
        and(
          eq(departmentLevelCourses.departmentId, departmentId),
          eq(departmentLevelCourses.courseId, courseId),
          eq(departmentLevelCourses.level, level),
        ),
      )
      .returning();
    return result;
  }

  async deleteDepartmentLevelCourse(
    departmentId: string,
    courseId: string,
    level: number,
  ) {
    const [result] = await this.db
      .delete(departmentLevelCourses)
      .where(
        and(
          eq(departmentLevelCourses.departmentId, departmentId),
          eq(departmentLevelCourses.courseId, courseId),
          eq(departmentLevelCourses.level, level),
        ),
      )
      .returning();
    return result;
  }
}
