require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.grade.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.file.deleteMany();
  await prisma.user.deleteMany();

  // ─── Admin User ───────────────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash("Admin@123", 12);
  await prisma.user.create({
    data: {
      email: "admin@schoolerp.com",
      password: adminPwd,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created: admin@schoolerp.com / Admin@123");

  // ─── Subjects ─────────────────────────────────────────────────────────────
  const subjectData = [
    { name: "Mathematics", code: "MATH101", description: "Core mathematics", credits: 4 },
    { name: "Physics", code: "PHY101", description: "Fundamentals of physics", credits: 3 },
    { name: "Chemistry", code: "CHE101", description: "Basic chemistry", credits: 3 },
    { name: "English", code: "ENG101", description: "English language and literature", credits: 3 },
    { name: "History", code: "HIS101", description: "World and local history", credits: 2 },
    { name: "Computer Science", code: "CS101", description: "Introduction to computing", credits: 4 },
    { name: "Biology", code: "BIO101", description: "Life sciences", credits: 3 },
    { name: "Geography", code: "GEO101", description: "Physical and human geography", credits: 2 },
  ];

  const subjects = await Promise.all(
    subjectData.map((s) => prisma.subject.create({ data: s }))
  );
  console.log(`✅ ${subjects.length} subjects created`);

  // ─── Teachers ─────────────────────────────────────────────────────────────
  const teacherPwd = await bcrypt.hash("Teacher@123", 12);
  const teacherData = [
    { firstName: "Rajesh", lastName: "Kumar", email: "rajesh@schoolerp.com", gender: "MALE", qualification: "M.Sc Mathematics", salary: 45000, employeeId: "EMP001" },
    { firstName: "Priya", lastName: "Sharma", email: "priya@schoolerp.com", gender: "FEMALE", qualification: "M.Sc Physics", salary: 42000, employeeId: "EMP002" },
    { firstName: "Anita", lastName: "Verma", email: "anita@schoolerp.com", gender: "FEMALE", qualification: "M.A English", salary: 40000, employeeId: "EMP003" },
    { firstName: "Suresh", lastName: "Patel", email: "suresh@schoolerp.com", gender: "MALE", qualification: "M.Tech CS", salary: 48000, employeeId: "EMP004" },
  ];

  const teachers = [];
  for (const t of teacherData) {
    const user = await prisma.user.create({
      data: { email: t.email, password: teacherPwd, role: "TEACHER" },
    });
    const teacher = await prisma.teacher.create({
      data: { ...t, userId: user.id },
    });
    teachers.push(teacher);
  }
  console.log(`✅ ${teachers.length} teachers created`);

  // Assign subjects to teachers
  await prisma.teacherSubject.createMany({
    data: [
      { teacherId: teachers[0].id, subjectId: subjects[0].id }, // Rajesh → Math
      { teacherId: teachers[1].id, subjectId: subjects[1].id }, // Priya → Physics
      { teacherId: teachers[1].id, subjectId: subjects[2].id }, // Priya → Chemistry
      { teacherId: teachers[2].id, subjectId: subjects[3].id }, // Anita → English
      { teacherId: teachers[3].id, subjectId: subjects[5].id }, // Suresh → CS
    ],
  });

  // ─── Classes ──────────────────────────────────────────────────────────────
  const classData = [
    { name: "Class 10", section: "A", grade: "10", teacherId: teachers[0].id, capacity: 35, room: "101", academicYear: "2024-25" },
    { name: "Class 10", section: "B", grade: "10", teacherId: teachers[1].id, capacity: 35, room: "102", academicYear: "2024-25" },
    { name: "Class 11", section: "A", grade: "11", teacherId: teachers[2].id, capacity: 30, room: "201", academicYear: "2024-25" },
    { name: "Class 12", section: "A", grade: "12", teacherId: teachers[3].id, capacity: 30, room: "301", academicYear: "2024-25" },
  ];

  const classes = await Promise.all(
    classData.map((c) => prisma.class.create({ data: c }))
  );
  console.log(`✅ ${classes.length} classes created`);

  // Assign subjects to classes
  await prisma.classSubject.createMany({
    data: [
      { classId: classes[0].id, subjectId: subjects[0].id },
      { classId: classes[0].id, subjectId: subjects[1].id },
      { classId: classes[0].id, subjectId: subjects[3].id },
      { classId: classes[1].id, subjectId: subjects[0].id },
      { classId: classes[1].id, subjectId: subjects[2].id },
      { classId: classes[2].id, subjectId: subjects[0].id },
      { classId: classes[2].id, subjectId: subjects[5].id },
    ],
  });

  // ─── Students ─────────────────────────────────────────────────────────────
  const studentPwd = await bcrypt.hash("Student@123", 12);
  const studentData = [
    { firstName: "Aarav", lastName: "Singh", email: "aarav@school.com", gender: "MALE", classId: classes[0].id, studentId: "STU001", parentName: "Amit Singh" },
    { firstName: "Diya", lastName: "Mehta", email: "diya@school.com", gender: "FEMALE", classId: classes[0].id, studentId: "STU002", parentName: "Rahul Mehta" },
    { firstName: "Rohan", lastName: "Gupta", email: "rohan@school.com", gender: "MALE", classId: classes[1].id, studentId: "STU003", parentName: "Sanjay Gupta" },
    { firstName: "Pooja", lastName: "Nair", email: "pooja@school.com", gender: "FEMALE", classId: classes[1].id, studentId: "STU004", parentName: "Krishnan Nair" },
    { firstName: "Kabir", lastName: "Joshi", email: "kabir@school.com", gender: "MALE", classId: classes[2].id, studentId: "STU005", parentName: "Vivek Joshi" },
    { firstName: "Ananya", lastName: "Reddy", email: "ananya@school.com", gender: "FEMALE", classId: classes[2].id, studentId: "STU006", parentName: "Ramesh Reddy" },
    { firstName: "Arjun", lastName: "Bose", email: "arjun@school.com", gender: "MALE", classId: classes[3].id, studentId: "STU007", parentName: "Subir Bose" },
    { firstName: "Ishaan", lastName: "Malhotra", email: "ishaan@school.com", gender: "MALE", classId: classes[3].id, studentId: "STU008", parentName: "Deepak Malhotra" },
  ];

  const students = [];
  for (const s of studentData) {
    const user = await prisma.user.create({
      data: { email: s.email, password: studentPwd, role: "STUDENT" },
    });
    const student = await prisma.student.create({
      data: { ...s, userId: user.id },
    });
    students.push(student);
  }
  console.log(`✅ ${students.length} students created`);

  // ─── Sample Attendance ────────────────────────────────────────────────────
  const today = new Date();
  const attendanceStatuses = ["PRESENT", "PRESENT", "PRESENT", "ABSENT", "LATE"];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const records = students.slice(0, 6).map((s) => ({
      studentId: s.id,
      classId: s.classId,
      date,
      status: attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)],
    }));

    await prisma.attendance.createMany({ data: records, skipDuplicates: true });
  }
  console.log("✅ Sample attendance records created");

  // ─── Sample Grades ────────────────────────────────────────────────────────
  const gradeRecords = [];
  for (const student of students.slice(0, 5)) {
    gradeRecords.push({
      studentId: student.id,
      subjectId: subjects[0].id,
      examType: "MIDTERM",
      marks: Math.floor(Math.random() * 40) + 60,
      maxMarks: 100,
      grade: "A",
      examDate: new Date("2024-10-15"),
    });
    gradeRecords.push({
      studentId: student.id,
      subjectId: subjects[3].id,
      examType: "MIDTERM",
      marks: Math.floor(Math.random() * 40) + 55,
      maxMarks: 100,
      grade: "B+",
      examDate: new Date("2024-10-16"),
    });
  }

  await prisma.grade.createMany({ data: gradeRecords });
  console.log("✅ Sample grades created");

  // ─── Announcements ────────────────────────────────────────────────────────
  await prisma.announcement.createMany({
    data: [
      { title: "Welcome to School ERP", content: "Our new school management system is live. Please update your profiles.", targetRole: null },
      { title: "Exam Schedule Released", content: "Mid-term examinations will begin on October 15. Check the timetable.", targetRole: "STUDENT" },
      { title: "Staff Meeting", content: "All teachers are requested to attend the staff meeting on Friday at 3 PM.", targetRole: "TEACHER" },
      { title: "Fee Payment Deadline", content: "Last date for quarterly fee submission is October 10.", targetRole: "STUDENT" },
    ],
  });
  console.log("✅ Announcements created");

  console.log("\n🎉 Seed complete!");
  console.log("─────────────────────────────────────");
  console.log("Login Credentials:");
  console.log("  Admin:   admin@schoolerp.com  / Admin@123");
  console.log("  Teacher: rajesh@schoolerp.com / Teacher@123");
  console.log("  Student: aarav@school.com     / Student@123");
  console.log("─────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
