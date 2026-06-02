-- สร้างฐานข้อมูล (กรณีรอบรับภาษาไทย)
CREATE DATABASE IF NOT EXISTS `srs_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `srs_db`;

-- 1. ตารางตั้งค่าภาคเรียน/ปีการศึกษา (Terms)
CREATE TABLE `terms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `term_name` VARCHAR(50) NOT NULL COMMENT 'เช่น 1/2569, 2/2568',
  `is_active` BOOLEAN DEFAULT FALSE COMMENT '1 = ภาคเรียนปัจจุบัน',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางกลุ่มบุคลากร (Staff Groups)
CREATE TABLE `staff_groups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `group_name` VARCHAR(100) NOT NULL COMMENT 'เช่น กลุ่ม 1, กลุ่ม 2, กลุ่มบริหาร',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตารางข้อมูลบุคลากร (Staffs)
CREATE TABLE `staffs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `staff_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'รหัสบุคลากร',
  `full_name` VARCHAR(150) NOT NULL COMMENT 'ชื่อ-สกุล',
  `position` VARCHAR(100) COMMENT 'ตำแหน่ง เช่น ครูผู้สอน, เจ้าหน้าที่',
  `group_id` INT,
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'สถานะการทำงาน',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`group_id`) REFERENCES `staff_groups`(`id`) ON DELETE SET NULL
);

-- 4. ตารางกิจกรรม (Activities)
CREATE TABLE `activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `activity_name` VARCHAR(255) NOT NULL,
  `activity_date` DATE NOT NULL,
  `term_id` INT NOT NULL,
  `status` ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming' COMMENT 'สถานะกิจกรรม',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON DELETE CASCADE
);

-- 5. ตารางเช็คชื่อการเข้าร่วมกิจกรรม (Attendance)
CREATE TABLE `act_attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `activity_id` INT NOT NULL,
  `staff_id` INT NOT NULL,
  `status` ENUM('present', 'leave', 'absent', 'pending') DEFAULT 'pending',
  `remark` TEXT COMMENT 'หมายเหตุ เช่น ลากิจ, ลาป่วย',
  `marked_by` INT COMMENT 'ผู้บันทึกข้อมูล (อ้างอิงรหัส user/staff)',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`staff_id`) REFERENCES `staffs`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_attendance` (`activity_id`, `staff_id`) -- 1 คนมี 1 สถานะต่อ 1 กิจกรรม
);

-- 6. ตารางผู้ใช้งานระบบตั้งค่า/แอดมิน (Users) -- ไม่บังคับแต่ควรมี
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'group_head') DEFAULT 'group_head',
  `staff_id` INT NULL COMMENT 'อ้างอิงไปที่ตาราง staff เพื่อให้รู้ว่าเป็นใคร',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`staff_id`) REFERENCES `staffs`(`id`) ON DELETE SET NULL
);

-- ==============================================================================
-- ข้อมูลตัวอย่างเริ่มต้น (Mock Data) สำหรับทดสอบระบบ
-- ==============================================================================

INSERT INTO `terms` (`term_name`, `is_active`) VALUES ('1/2569', 1), ('2/2568', 0);

INSERT INTO `staff_groups` (`group_name`) VALUES ('กลุ่ม 1'), ('กลุ่ม 2'), ('กลุ่ม 3');

INSERT INTO `staffs` (`staff_code`, `full_name`, `position`, `group_id`) VALUES 
('101', 'นายสมชาย ใจดี', 'ครูผู้สอน', 1),
('102', 'นางสาวสมหญิง รักเรียน', 'เจ้าหน้าที่ธุรการ', 1),
('103', 'นายมานะ อดทน', 'ครูผู้สอน', 1),
('104', 'นางสุดา งามตา', 'หัวหน้าแผนก', 2);

INSERT INTO `activities` (`activity_name`, `activity_date`, `term_id`, `status`) VALUES 
('ประชุมประจำเดือนบุคลากร', '2026-05-15', 1, 'active'),
('กิจกรรม 5ส. วิทยาลัย', '2026-05-20', 1, 'completed');
