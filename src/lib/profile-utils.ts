/**
 * Utilities for user profile management
 */

interface CourseData {
  enrolmentStatus?: string;
  progress?: number;
}

interface LessonData {
  status?: string;
}

interface TestResultData {
  status?: string;
}

/**
 * Calculate course statistics
 */
export const calculateCourseStats = (userCourses: CourseData[] = []) => {
  const total = userCourses.length;
  const inProgress = userCourses.filter(
    (item) => item.enrolmentStatus === "IN_PROGRESS",
  ).length;
  const completed = userCourses.filter(
    (item) => item.enrolmentStatus === "COMPLETED",
  ).length;

  const averageProgress = total
    ? Math.round(
        userCourses.reduce((acc, item) => acc + (item.progress ?? 0), 0) /
          total,
      )
    : 0;

  return { total, inProgress, completed, averageProgress };
};

/**
 * Calculate lesson statistics
 */
export const calculateLessonStats = (userLessons: LessonData[] = []) => {
  const total = userLessons.length;
  const completed = userLessons.filter(
    (lesson) => lesson.status === "PASS",
  ).length;
  const doing = userLessons.filter(
    (lesson) => lesson.status === "DOING",
  ).length;

  return { total, completed, doing };
};

/**
 * Calculate test statistics
 */
export const calculateTestStats = (testResults: TestResultData[] = []) => {
  const total = testResults.length;
  const passed = testResults.filter((test) => test.status === "PASSED").length;
  const failed = total - passed;

  // Calculate pass rate
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return { total, passed, failed, passRate };
};

/**
 * Get user initials from name or email
 */
export const getUserInitials = (
  name?: string | null,
  email?: string | null,
): string => {
  if (name) {
    // Get first letter of first and last name
    const nameParts = name.trim().split(" ");
    if (nameParts.length >= 2) {
      return (
        nameParts[0][0] + nameParts[nameParts.length - 1][0]
      ).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  if (email) {
    return email.charAt(0).toUpperCase();
  }

  return "U";
};

/**
 * Get avatar color based on user role
 */
export const getAvatarColorByRole = (role?: string): string => {
  const colors: Record<string, string> = {
    ADMIN: "#f5222d",
    TEACHER: "#1890ff",
    USER: "#52c41a",
    STUDENT: "#1677ff",
  };

  return colors[role || "USER"] || "#1677ff";
};
