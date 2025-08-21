const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = require('./config/db');
const Student = require('./models/Student');

// Sample student data
const sampleStudents = [
  {
    StudentID: 12001,
    FirstName: 'Alice',
    LastName: 'Johnson',
    Email: 'alice.johnson@university.edu',
    Department: 'Computer Science',
    YearOfStudy: 3,
    Major: 'Software Engineering',
    Phone: '+1234567001',
    Address: '123 University Ave',
    DateOfBirth: new Date('2001-03-15'),
    EnrollmentDate: new Date('2021-09-01'),
    StudentStatus: 'Active',
    GPA: 3.8,
    ProfileImage: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=AJ'
  },
  {
    StudentID: 12002,
    FirstName: 'Bob',
    LastName: 'Wilson',
    Email: 'bob.wilson@university.edu',
    Department: 'Engineering',
    YearOfStudy: 2,
    Major: 'Mechanical Engineering',
    Phone: '+1234567002',
    Address: '456 Campus Blvd',
    DateOfBirth: new Date('2002-07-22'),
    EnrollmentDate: new Date('2022-09-01'),
    StudentStatus: 'Active',
    GPA: 3.6,
    ProfileImage: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=BW'
  },
  {
    StudentID: 12003,
    FirstName: 'Carol',
    LastName: 'Davis',
    Email: 'carol.davis@university.edu',
    Department: 'Mathematics',
    YearOfStudy: 4,
    Major: 'Applied Mathematics',
    Phone: '+1234567003',
    Address: '789 Student Lane',
    DateOfBirth: new Date('2000-11-08'),
    EnrollmentDate: new Date('2020-09-01'),
    StudentStatus: 'Active',
    GPA: 3.9,
    ProfileImage: 'https://via.placeholder.com/150/45B7D1/FFFFFF?text=CD'
  },
  {
    StudentID: 12004,
    FirstName: 'David',
    LastName: 'Brown',
    Email: 'david.brown@university.edu',
    Department: 'Physics',
    YearOfStudy: 1,
    Major: 'Theoretical Physics',
    Phone: '+1234567004',
    Address: '321 Science Circle',
    DateOfBirth: new Date('2003-01-30'),
    EnrollmentDate: new Date('2023-09-01'),
    StudentStatus: 'Active',
    GPA: 3.4,
    ProfileImage: 'https://via.placeholder.com/150/96CEB4/FFFFFF?text=DB'
  },
  {
    StudentID: 12005,
    FirstName: 'Emma',
    LastName: 'Garcia',
    Email: 'emma.garcia@university.edu',
    Department: 'Chemistry',
    YearOfStudy: 3,
    Major: 'Biochemistry',
    Phone: '+1234567005',
    Address: '654 Research Road',
    DateOfBirth: new Date('2001-09-12'),
    EnrollmentDate: new Date('2021-09-01'),
    StudentStatus: 'Active',
    GPA: 3.7,
    ProfileImage: 'https://via.placeholder.com/150/FECA57/FFFFFF?text=EG'
  }
];

async function addSampleStudents() {
  console.log('👥 Adding 5 sample student records to database...\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Clear existing demo students first
    await Student.deleteMany({ StudentID: { $in: [12001, 12002, 12003, 12004, 12005] } });
    console.log('🧹 Cleared any existing demo student records\n');

    // Add each student
    for (let i = 0; i < sampleStudents.length; i++) {
      const student = sampleStudents[i];
      const recordNumber = i + 1;
      
      console.log(`${recordNumber}️⃣ Adding student: ${student.FirstName} ${student.LastName}...`);
      
      try {
        const newStudent = new Student(student);
        await newStudent.save();
        
        console.log(`   ✅ ${student.FirstName} ${student.LastName}: Added successfully`);
        console.log(`   📚 Department: ${student.Department}`);
        console.log(`   📧 Email: ${student.Email}`);
        console.log(`   📊 GPA: ${student.GPA}`);
        
      } catch (error) {
        console.log(`   ❌ Failed to add ${student.FirstName} ${student.LastName}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Sample student records added successfully!');
    console.log('\n📊 Verification - Getting student count...');
    
    // Verify students were added
    const studentCount = await Student.countDocuments({ StudentID: { $in: [12001, 12002, 12003, 12004, 12005] } });
    console.log(`   👥 Total demo students in database: ${studentCount}`);
    
    console.log('\n🎯 Student data is now available for Live Pulse Monitor enrichment!');
    console.log('💡 The attendance records will now show proper student names and details.');
    
  } catch (error) {
    console.error('❌ Error adding sample students:', error.message);
  } finally {
    // Close database connection
    try {
      await mongoose.connection.close();
      console.log('\n🔒 Database connection closed');
    } catch (closeError) {
      console.error('❌ Error closing database:', closeError.message);
    }
  }
}

// Run the script
addSampleStudents()
  .then(() => {
    console.log('\n✅ Student data setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Student setup failed:', error.message);
    process.exit(1);
  });
