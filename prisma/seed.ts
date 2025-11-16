import { hashPassword } from "better-auth/crypto";
import { format } from "date-fns";
import { BloodGroup, Gender, PrismaClient } from "./generated/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🗑️  Clearing existing data...");

  // Clear in correct order (respecting foreign keys)
  await prisma.appointment_events.deleteMany();
  await prisma.prescription_items.deleteMany();
  await prisma.prescriptions.deleteMany();
  await prisma.test_results.deleteMany();
  await prisma.test_orders.deleteMany();
  await prisma.bill_items.deleteMany();
  await prisma.payments.deleteMany();
  await prisma.bills.deleteMany();
  await prisma.appointments.deleteMany();
  await prisma.employee_specializations.deleteMany();
  await prisma.employees.deleteMany();
  await prisma.test_types.deleteMany();
  await prisma.test_templates.deleteMany();
  await prisma.labs.deleteMany();
  await prisma.medicines.deleteMany();
  await prisma.medicine_instructions.deleteMany();
  await prisma.specializations.deleteMany();
  await prisma.patients.deleteMany();
  await prisma.documents.deleteMany();
  await prisma.notifications.deleteMany();
  await prisma.sessions.deleteMany();
  await prisma.verifications.deleteMany();
  await prisma.accounts.deleteMany();
  await prisma.user_roles.deleteMany();
  await prisma.role_permissions.deleteMany();
  await prisma.users.deleteMany();
  await prisma.roles.deleteMany();
  await prisma.permissions.deleteMany();
  await prisma.departments.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.transactions.deleteMany();
  await prisma.ledger_accounts.deleteMany();
  await prisma.categories.deleteMany();

  // 1. Create Departments
  console.log("🏥 Creating departments...");
  const cardiology = await prisma.departments.create({
    data: {
      name: "Cardiology",
      code: "CARD",
      description: "Heart and cardiovascular system treatment",
      isActive: true,
    },
  });

  const orthopedics = await prisma.departments.create({
    data: {
      name: "Orthopedics",
      code: "ORTHO",
      description: "Bone, joint, and muscle treatment",
      isActive: true,
    },
  });

  const pediatrics = await prisma.departments.create({
    data: {
      name: "Pediatrics",
      code: "PED",
      description: "Children's healthcare",
      isActive: true,
    },
  });

  const laboratory = await prisma.departments.create({
    data: {
      name: "Laboratory",
      code: "LAB",
      description: "Diagnostic testing and analysis",
      isActive: true,
    },
  });

  const radiology = await prisma.departments.create({
    data: {
      name: "Radiology",
      code: "RAD",
      description: "Medical imaging and diagnostics",
      isActive: true,
    },
  });

  // 2. Create Specializations
  console.log("🎓 Creating specializations...");
  const interventionalCardiology = await prisma.specializations.create({
    data: {
      name: "Interventional Cardiology",
      code: "INT-CARD",
      description: "Catheter-based treatment of heart disease",
      isActive: true,
    },
  });

  const sportsMedicine = await prisma.specializations.create({
    data: {
      name: "Sports Medicine",
      code: "SPORTS",
      description: "Treatment of sports-related injuries",
      isActive: true,
    },
  });

  const generalPediatrics = await prisma.specializations.create({
    data: {
      name: "General Pediatrics",
      code: "GEN-PED",
      description: "Comprehensive healthcare for children",
      isActive: true,
    },
  });

  const clinicalPathology = await prisma.specializations.create({
    data: {
      name: "Clinical Pathology",
      code: "CLIN-PATH",
      description: "Laboratory diagnosis and testing",
      isActive: true,
    },
  });

  // 3. Create Roles
  console.log("👤 Creating roles...");
  const superAdminRole = await prisma.roles.create({
    data: {
      name: "Super Admin",
      slug: "super_admin",
      description: "Full system access",
      isSystem: true,
      isActive: true,
    },
  });

  const adminRole = await prisma.roles.create({
    data: {
      name: "Admin",
      slug: "admin",
      description: "Administrative access",
      isSystem: true,
      isActive: true,
    },
  });

  const doctorRole = await prisma.roles.create({
    data: {
      name: "Doctor",
      slug: "doctor",
      description: "Medical practitioner",
      isSystem: true,
      isActive: true,
    },
  });

  const receptionistRole = await prisma.roles.create({
    data: {
      name: "Receptionist",
      slug: "receptionist",
      description: "Front desk and patient registration",
      isSystem: true,
      isActive: true,
    },
  });

  const labTechRole = await prisma.roles.create({
    data: {
      name: "Lab Technician",
      slug: "lab_technician",
      description: "Laboratory testing specialist",
      isSystem: true,
      isActive: true,
    },
  });

  // 4. Create Permissions
  console.log("🔐 Creating permissions...");
  const permissions = [
    // Patients
    { name: "View Patients", slug: "patients.view", module: "patients" },
    { name: "Create Patients", slug: "patients.create", module: "patients" },
    { name: "Update Patients", slug: "patients.update", module: "patients" },
    { name: "Delete Patients", slug: "patients.delete", module: "patients" },
    // Visits
    { name: "View Visits", slug: "visits.view", module: "visits" },
    { name: "Create Visits", slug: "visits.create", module: "visits" },
    { name: "Update Visits", slug: "visits.update", module: "visits" },
    { name: "Delete Visits", slug: "visits.delete", module: "visits" },
    // Billing
    { name: "View Bills", slug: "billing.view", module: "billing" },
    { name: "Create Bills", slug: "billing.create", module: "billing" },
    { name: "Update Bills", slug: "billing.update", module: "billing" },
    { name: "Process Payments", slug: "billing.payment", module: "billing" },
    // Labs
    { name: "View Tests", slug: "labs.view", module: "labs" },
    { name: "Order Tests", slug: "labs.order", module: "labs" },
    { name: "Enter Results", slug: "labs.results", module: "labs" },
    { name: "Review Results", slug: "labs.review", module: "labs" },
    // Users
    { name: "View Users", slug: "users.view", module: "users" },
    { name: "Create Users", slug: "users.create", module: "users" },
    { name: "Update Users", slug: "users.update", module: "users" },
    { name: "Delete Users", slug: "users.delete", module: "users" },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((p) => prisma.permissions.create({ data: p })),
  );

  // 5. Assign Permissions to Roles
  console.log("🔗 Assigning permissions to roles...");
  // Super Admin gets all permissions
  await Promise.all(
    createdPermissions.map((p) =>
      prisma.role_permissions.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: p.id,
        },
      }),
    ),
  );

  // Admin gets all permissions except user management
  const adminPerms = createdPermissions.filter((p) => p.module !== "users");
  await Promise.all(
    adminPerms.map((p) =>
      prisma.role_permissions.create({
        data: {
          roleId: adminRole.id,
          permissionId: p.id,
        },
      }),
    ),
  );

  // Doctor gets patient, visit, and lab permissions
  const doctorPerms = createdPermissions.filter((p) =>
    ["patients", "visits", "labs"].includes(p.module),
  );
  await Promise.all(
    doctorPerms.map((p) =>
      prisma.role_permissions.create({
        data: {
          roleId: doctorRole.id,
          permissionId: p.id,
        },
      }),
    ),
  );

  // Receptionist gets patient, visit, and billing permissions
  const receptionistPerms = createdPermissions.filter((p) =>
    ["patients", "visits", "billing"].includes(p.module),
  );
  await Promise.all(
    receptionistPerms.map((p) =>
      prisma.role_permissions.create({
        data: {
          roleId: receptionistRole.id,
          permissionId: p.id,
        },
      }),
    ),
  );

  // Lab Tech gets lab permissions
  const labPerms = createdPermissions.filter((p) => p.module === "labs");
  await Promise.all(
    labPerms.map((p) =>
      prisma.role_permissions.create({
        data: {
          roleId: labTechRole.id,
          permissionId: p.id,
        },
      }),
    ),
  );

  // 6. Create Users & Employees (Transaction-based like the API)
  console.log("👥 Creating users and employees...");
  const hashedPassword = await hashPassword("password123");

  // Admin User (no employee profile)
  const adminUser = await prisma.users.create({
    data: {
      name: "Admin User",
      email: "admin@hospital.com",
      emailVerified: true,
      phone: "+1234567890",
      isActive: true,
    },
  });

  await prisma.accounts.create({
    data: {
      userId: adminUser.id,
      accountId: adminUser.email,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  await prisma.user_roles.create({
    data: {
      userId: adminUser.id,
      roleId: superAdminRole.id,
    },
  });

  // Dr. Smith - Cardiologist
  const drSmith = await prisma.users.create({
    data: {
      name: "Dr. John Smith",
      email: "dr.smith@hospital.com",
      emailVerified: true,
      phone: "+1234567891",
      isActive: true,
    },
  });

  await prisma.accounts.create({
    data: {
      userId: drSmith.id,
      accountId: drSmith.email,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  await prisma.user_roles.create({
    data: {
      userId: drSmith.id,
      roleId: doctorRole.id,
    },
  });

  const drSmithEmployee = await prisma.employees.create({
    data: {
      userId: drSmith.id,
      departmentId: cardiology.id,
      bio: "Experienced cardiologist with over 15 years in interventional cardiology. Specializes in complex coronary interventions.",
      qualification: "MD, FACC, Fellowship in Interventional Cardiology",
      consultationFee: 1500,
      hospitalFee: 500,
      isAvailable: true,
    },
  });

  await prisma.employee_specializations.create({
    data: {
      employeeId: drSmithEmployee.id,
      specializationId: interventionalCardiology.id,
    },
  });

  // Dr. Johnson - Orthopedic Surgeon
  const drJohnson = await prisma.users.create({
    data: {
      name: "Dr. Sarah Johnson",
      email: "dr.johnson@hospital.com",
      emailVerified: true,
      phone: "+1234567892",
      isActive: true,
    },
  });

  await prisma.accounts.create({
    data: {
      userId: drJohnson.id,
      accountId: drJohnson.email,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  await prisma.user_roles.create({
    data: {
      userId: drJohnson.id,
      roleId: doctorRole.id,
    },
  });

  const drJohnsonEmployee = await prisma.employees.create({
    data: {
      userId: drJohnson.id,
      departmentId: orthopedics.id,
      bio: "Board-certified orthopedic surgeon specializing in sports medicine and arthroscopic surgery.",
      qualification: "MD, FAAOS, Sports Medicine Fellowship",
      consultationFee: 1200,
      hospitalFee: 400,
      isAvailable: true,
    },
  });

  await prisma.employee_specializations.create({
    data: {
      employeeId: drJohnsonEmployee.id,
      specializationId: sportsMedicine.id,
    },
  });

  // Dr. Brown - Pediatrician
  const drBrown = await prisma.users.create({
    data: {
      name: "Dr. Emily Brown",
      email: "dr.brown@hospital.com",
      emailVerified: true,
      phone: "+1234567893",
      isActive: true,
    },
  });

  await prisma.accounts.create({
    data: {
      userId: drBrown.id,
      accountId: drBrown.email,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  await prisma.user_roles.create({
    data: {
      userId: drBrown.id,
      roleId: doctorRole.id,
    },
  });

  const drBrownEmployee = await prisma.employees.create({
    data: {
      userId: drBrown.id,
      departmentId: pediatrics.id,
      bio: "Compassionate pediatrician dedicated to providing comprehensive care for children from infancy through adolescence.",
      qualification: "MD, FAAP, Board Certified Pediatrician",
      consultationFee: 1000,
      hospitalFee: 300,
      isAvailable: true,
    },
  });

  await prisma.employee_specializations.create({
    data: {
      employeeId: drBrownEmployee.id,
      specializationId: generalPediatrics.id,
    },
  });

  // Receptionist
  const receptionist = await prisma.users.create({
    data: {
      name: "Jane Receptionist",
      email: "reception@hospital.com",
      emailVerified: true,
      phone: "+1234567894",
      isActive: true,
    },
  });

  await prisma.accounts.create({
    data: {
      userId: receptionist.id,
      accountId: receptionist.email,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  await prisma.user_roles.create({
    data: {
      userId: receptionist.id,
      roleId: receptionistRole.id,
    },
  });

  // Lab Technician
  const labTech = await prisma.users.create({
    data: {
      name: "Mike Lab Tech",
      email: "lab@hospital.com",
      emailVerified: true,
      phone: "+1234567895",
      isActive: true,
    },
  });

  await prisma.accounts.create({
    data: {
      userId: labTech.id,
      accountId: labTech.email,
      providerId: "credential",
      password: hashedPassword,
    },
  });

  await prisma.user_roles.create({
    data: {
      userId: labTech.id,
      roleId: labTechRole.id,
    },
  });

  const labTechEmployee = await prisma.employees.create({
    data: {
      userId: labTech.id,
      departmentId: laboratory.id,
      bio: "Experienced clinical laboratory technician",
      qualification: "BS in Medical Technology, ASCP Certified",
      isAvailable: true,
    },
  });

  await prisma.employee_specializations.create({
    data: {
      employeeId: labTechEmployee.id,
      specializationId: clinicalPathology.id,
    },
  });

  // 7. Create Patients
  console.log("🏥 Creating patients...");
  const currentYear = new Date().getFullYear().toString().slice(-2);

  await prisma.patients.create({
    data: {
      patientId: `PID${currentYear}-000001`,
      name: "Alice Williams",
      age: 45,
      phone: "+1234560001",
      gender: Gender.FEMALE,
      bloodGroup: BloodGroup.A_POSITIVE,
      email: "alice@email.com",
      address: "123 Main St, City",
      notes: "Regular patient with hypertension",
      isActive: true,
    },
  });

  await prisma.patients.create({
    data: {
      patientId: `PID${currentYear}-000002`,
      name: "Bob Martinez",
      age: 32,
      phone: "+1234560002",
      gender: Gender.MALE,
      bloodGroup: BloodGroup.O_POSITIVE,
      email: "bob@email.com",
      address: "456 Oak Ave, City",
      notes: "Athlete, previous knee injury",
      isActive: true,
    },
  });

  await prisma.patients.create({
    data: {
      patientId: `PID${currentYear}-000003`,
      name: "Carol Davis",
      age: 8,
      phone: "+1234560003",
      gender: Gender.FEMALE,
      bloodGroup: BloodGroup.B_POSITIVE,
      email: "carol.parent@email.com",
      address: "789 Pine Rd, City",
      notes: "Mild allergies to peanuts",
      isActive: true,
    },
  });

  await prisma.patients.create({
    data: {
      patientId: `PID${currentYear}-000004`,
      name: "David Chen",
      age: 58,
      phone: "+1234560004",
      gender: Gender.MALE,
      bloodGroup: BloodGroup.AB_POSITIVE,
      email: "david@email.com",
      address: "321 Elm St, City",
      notes: "Diabetic patient, regular check-ups",
      isActive: true,
    },
  });

  await prisma.patients.create({
    data: {
      patientId: `PID${currentYear}-000005`,
      name: "Eva Thompson",
      age: 29,
      phone: "+1234560005",
      gender: Gender.FEMALE,
      bloodGroup: BloodGroup.O_NEGATIVE,
      email: "eva@email.com",
      address: "654 Maple Dr, City",
      isActive: true,
    },
  });

  // 8. Create Labs
  console.log("🔬 Creating labs...");
  const pathologyLab = await prisma.labs.create({
    data: {
      name: "Pathology Lab",
      code: "PATH",
      departmentId: laboratory.id,
      description: "Blood tests and tissue analysis",
      isActive: true,
    },
  });

  const radiologyLab = await prisma.labs.create({
    data: {
      name: "Radiology Department",
      code: "XRAY",
      departmentId: radiology.id,
      description: "X-Ray, CT, and MRI imaging",
      isActive: true,
    },
  });

  // 9. Create Test Types
  console.log("🧪 Creating test types...");
  await prisma.test_types.create({
    data: {
      name: "Complete Blood Count (CBC)",
      code: "CBC",
      labId: pathologyLab.id,
      price: 500,
      description: "Comprehensive blood cell analysis",
      isActive: true,
    },
  });

  await prisma.test_types.create({
    data: {
      name: "Lipid Profile",
      code: "LIPID",
      labId: pathologyLab.id,
      price: 800,
      description: "Cholesterol and triglycerides test",
      isActive: true,
    },
  });

  await prisma.test_types.create({
    data: {
      name: "Blood Glucose (Fasting)",
      code: "FBS",
      labId: pathologyLab.id,
      price: 300,
      description: "Fasting blood sugar test",
      isActive: true,
    },
  });

  await prisma.test_types.create({
    data: {
      name: "Chest X-Ray",
      code: "CXR",
      labId: radiologyLab.id,
      price: 1200,
      description: "Chest radiograph",
      isActive: true,
    },
  });

  // 10. Create Medicine Instructions
  console.log("💊 Creating medicine instructions...");
  await prisma.medicine_instructions.create({
    data: {
      name: "1+0+1 (After meal)",
      description: "Morning and night after meals",
      isActive: true,
    },
  });

  await prisma.medicine_instructions.create({
    data: {
      name: "1+1+1 (Before meal)",
      description: "Three times daily before meals",
      isActive: true,
    },
  });

  await prisma.medicine_instructions.create({
    data: {
      name: "0+0+1 (Before sleep)",
      description: "Once at night before sleep",
      isActive: true,
    },
  });

  // 11. Create Medicines
  console.log("💊 Creating medicines...");
  await prisma.medicines.create({
    data: {
      name: "Paracetamol",
      genericName: "Acetaminophen",
      type: "Tablet",
      manufacturer: "PharmaCo",
      strength: "500mg",
      price: 2,
      stock: 1000,
      minStock: 100,
      isActive: true,
    },
  });

  await prisma.medicines.create({
    data: {
      name: "Amoxicillin",
      genericName: "Amoxicillin",
      type: "Capsule",
      manufacturer: "MediCorp",
      strength: "250mg",
      price: 5,
      stock: 500,
      minStock: 50,
      isActive: true,
    },
  });

  await prisma.medicines.create({
    data: {
      name: "Metformin",
      genericName: "Metformin HCl",
      type: "Tablet",
      manufacturer: "DiabetesCare",
      strength: "500mg",
      price: 3,
      stock: 800,
      minStock: 100,
      isActive: true,
    },
  });

  // 12. Create Settings
  console.log("⚙️ Creating settings...");
  await prisma.settings.create({
    data: {
      key: "hospital_name",
      value: "City General Hospital",
      type: "string",
      isPublic: true,
    },
  });

  await prisma.settings.create({
    data: {
      key: "hospital_address",
      value: "123 Healthcare Blvd, Medical City, MC 12345",
      type: "string",
      isPublic: true,
    },
  });

  await prisma.settings.create({
    data: {
      key: "hospital_phone",
      value: "+1-800-HOSPITAL",
      type: "string",
      isPublic: true,
    },
  });

  await prisma.settings.create({
    data: {
      key: "hospital_email",
      value: "info@cityhospital.com",
      type: "string",
      isPublic: true,
    },
  });

  await prisma.settings.create({
    data: {
      key: "default_consultation_fee",
      value: "1000",
      type: "number",
      isPublic: false,
    },
  });

  await prisma.settings.create({
    data: {
      key: "tax_percentage",
      value: "0",
      type: "number",
      isPublic: false,
    },
  });

  // 13. Create Ledger Accounts
  console.log("💰 Creating ledger accounts...");
  await prisma.ledger_accounts.create({
    data: {
      name: "Cash Account",
      accountType: "cash",
      balance: 0,
      isActive: true,
    },
  });

  await prisma.ledger_accounts.create({
    data: {
      name: "Bank Account - Main",
      accountType: "bank",
      balance: 0,
      isActive: true,
    },
  });

  await prisma.ledger_accounts.create({
    data: {
      name: "Revenue Account",
      accountType: "revenue",
      balance: 0,
      isActive: true,
    },
  });

  // 14. Create Sample Appointments
  console.log("📅 Creating sample appointments...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all patients and doctors for appointments
  const patients = await prisma.patients.findMany({
    where: { isActive: true },
  });

  const doctorEmployees = await prisma.employees.findMany({
    where: {
      consultationFee: { not: null },
      isAvailable: true,
    },
    include: { user: true },
  });

  // Create appointments for today
  let serialCounter = 1;

  // Use the first doctor as the assigner for all appointments
  const assignerEmployee = doctorEmployees[0];

  for (const doctor of doctorEmployees) {
    // Create 3-5 appointments per doctor
    const appointmentCount = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < appointmentCount; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const appointmentHour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
      const appointmentMinute = Math.floor(Math.random() * 60);

      const appointmentDate = new Date(today);
      appointmentDate.setHours(appointmentHour, appointmentMinute, 0, 0);

      const statusOptions = ["WAITING", "IN_CONSULTATION", "COMPLETED"];
      const status =
        statusOptions[Math.floor(Math.random() * statusOptions.length)];

      const appointmentTypeOptions = ["NEW", "FOLLOWUP"];
      const appointmentType =
        appointmentTypeOptions[
          Math.floor(Math.random() * appointmentTypeOptions.length)
        ];

      await prisma.appointments.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          assignedBy: assignerEmployee.id, // Use employee ID, not user ID
          appointmentType: appointmentType as "NEW" | "FOLLOWUP",
          chiefComplaint: "Regular checkup",
          diagnosis: null,
          appointmentDate,
          appointmentMonth: format(appointmentDate, "yyyy-MM"),
          serialNumber: serialCounter++,
          queuePosition: serialCounter - 1,
          status: status as "WAITING" | "IN_CONSULTATION" | "COMPLETED",
        },
      });
    }
  }

  console.log("✅ Seeding completed successfully!");
  console.log("\n📋 Login Credentials:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Admin:");
  console.log("  Email: admin@hospital.com");
  console.log("  Password: password123");
  console.log("\nDoctors:");
  console.log("  Email: dr.smith@hospital.com (Cardiology)");
  console.log("  Email: dr.johnson@hospital.com (Orthopedics)");
  console.log("  Email: dr.brown@hospital.com (Pediatrics)");
  console.log("  Password: password123 (for all)");
  console.log("\nReceptionist:");
  console.log("  Email: reception@hospital.com");
  console.log("  Password: password123");
  console.log("\nLab Technician:");
  console.log("  Email: lab@hospital.com");
  console.log("  Password: password123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
