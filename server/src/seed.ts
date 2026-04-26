import { prisma } from './db.js';
import { hashPassword } from './auth.js';

/**
 * Idempotent seed that creates a few demo users + a small committee/task graph
 * matching the frontend defaults. Safe to re-run; uses upserts.
 */
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aburabee.gov' },
    update: {},
    create: {
      email: 'admin@aburabee.gov',
      name: 'مدير النظام',
      passwordHash: await hashPassword('admin1234'),
      role: 'admin',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@aburabee.gov' },
    update: {},
    create: {
      email: 'staff@aburabee.gov',
      name: 'موظف الإدارة',
      passwordHash: await hashPassword('staff1234'),
      role: 'staff',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@aburabee.gov' },
    update: {},
    create: {
      email: 'viewer@aburabee.gov',
      name: 'مشاهد',
      passwordHash: await hashPassword('viewer1234'),
      role: 'viewer',
    },
  });

  const committee = await prisma.committee.upsert({
    where: { id: 'CMT-MAR-07' },
    update: {},
    create: {
      id: 'CMT-MAR-07',
      name: 'فريق عمل السفينة (سفينة المسح البحري سلطان)',
      nameEn: 'Vessel team — Marine Survey vessel "Sultan"',
      scope: 'internal',
      department: 'marine',
      representative: 'طلال بن ربيع الشافعي',
      head: 'طلال بن ربيع الشافعي',
      members: 10,
      organizer: 'الهيئة العامة للمساحة والمعلومات الجيومكانية',
      status: 'active',
      active: true,
    },
  });

  const root = await prisma.task.upsert({
    where: { id: 'TSK-T-001' },
    update: {},
    create: {
      id: 'TSK-T-001',
      title: 'إعداد محضر اجتماع NIOHC-25',
      description: 'تجهيز ومتابعة محضر اجتماع اللجنة الهيدروغرافية لشمال المحيط الهندي.',
      kind: 'team',
      team: 'الإدارة التنفيذية للمسح البحري',
      committeeId: committee.id,
      department: 'marine',
      assignee: 'الإدارة التنفيذية للمسح البحري',
      priority: 'high',
      status: 'inProgress',
      dueDate: '2026-05-20',
      progress: 45,
    },
  });

  const sub = await prisma.task.upsert({
    where: { id: 'TSK-T-001-A' },
    update: {},
    create: {
      id: 'TSK-T-001-A',
      title: 'تجميع ملاحظات الأعضاء',
      kind: 'team',
      committeeId: committee.id,
      department: 'marine',
      priority: 'medium',
      status: 'planned',
      progress: 0,
      parentTaskId: root.id,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete:', { admin: admin.email, staff: staff.email, viewer: viewer.email, root: root.id, sub: sub.id });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
