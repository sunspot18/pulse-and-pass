-- =============================================================================
-- PULSE & PASS — INDUSTRIAL DIGITAL TICKETING & EVENT PLATFORM
-- MySQL / MariaDB Complete Schema & Seed Data Dump
-- Compatible with phpMyAdmin, XAMPP, MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- -----------------------------------------------------------------------------
-- Database Initialization (Optional, safe if already created in phpMyAdmin)
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `pulse_and_pass` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `pulse_and_pass`;

-- -----------------------------------------------------------------------------
-- Table Drop Statements (Safe Re-import)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_log`;
DROP TABLE IF EXISTS `checkins`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `reservations`;
DROP TABLE IF EXISTS `ticket_tiers`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `venues`;
DROP TABLE IF EXISTS `users`;

-- -----------------------------------------------------------------------------
-- Table structure for table `users`
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `role` ENUM('attendee', 'organizer', 'admin') NOT NULL DEFAULT 'attendee',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table `venues`
-- -----------------------------------------------------------------------------
CREATE TABLE `venues` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `postal_code` VARCHAR(20) NOT NULL,
  `capacity` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_venues_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table `events`
-- -----------------------------------------------------------------------------
CREATE TABLE `events` (
  `id` VARCHAR(36) NOT NULL,
  `organizer_id` VARCHAR(36) NOT NULL,
  `venue_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `status` ENUM('draft', 'published', 'cancelled', 'completed') NOT NULL DEFAULT 'published',
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `doors_open_time` DATETIME DEFAULT NULL,
  `age_restriction` VARCHAR(50) DEFAULT 'All Ages',
  `banner_url` TEXT DEFAULT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_events_slug` (`slug`),
  KEY `idx_events_status_start_time` (`status`, `start_time`),
  KEY `idx_events_category` (`category`),
  KEY `idx_events_organizer_id` (`organizer_id`),
  KEY `idx_events_venue_id` (`venue_id`),
  KEY `idx_events_featured` (`is_featured`),
  CONSTRAINT `fk_events_organizer` FOREIGN KEY (`organizer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_events_venue` FOREIGN KEY (`venue_id`) REFERENCES `venues` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table `ticket_tiers`
-- -----------------------------------------------------------------------------
CREATE TABLE `ticket_tiers` (
  `id` VARCHAR(36) NOT NULL,
  `event_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price_paise` INT NOT NULL,
  `capacity` INT NOT NULL,
  `sold` INT NOT NULL DEFAULT 0,
  `sales_start` DATETIME NOT NULL,
  `sales_end` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ticket_tiers_event_id` (`event_id`),
  CONSTRAINT `fk_tiers_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table `reservations`
-- -----------------------------------------------------------------------------
CREATE TABLE `reservations` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `tier_id` VARCHAR(36) NOT NULL,
  `quantity` INT NOT NULL,
  `status` ENUM('active', 'completed', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reservations_status_expires` (`status`, `expires_at`),
  KEY `idx_reservations_user_id` (`user_id`),
  KEY `idx_reservations_tier_id` (`tier_id`),
  CONSTRAINT `fk_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reservations_tier` FOREIGN KEY (`tier_id`) REFERENCES `ticket_tiers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table `orders`
-- -----------------------------------------------------------------------------
CREATE TABLE `orders` (
  `id` VARCHAR(36) NOT NULL,
  `order_number` VARCHAR(32) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `event_id` VARCHAR(36) NOT NULL,
  `reservation_id` VARCHAR(36) NOT NULL,
  `total_amount_paise` INT NOT NULL,
  `status` ENUM('confirmed', 'cancelled', 'refunded') NOT NULL DEFAULT 'confirmed',
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'SIMULATED_UPI',
  `payment_ref` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_number` (`order_number`),
  UNIQUE KEY `uq_orders_reservation` (`reservation_id`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_event_id` (`event_id`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table `order_items`
-- -----------------------------------------------------------------------------
CREATE TABLE `order_items` (
  `id` VARCHAR(36) NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `tier_id` VARCHAR(36) NOT NULL,
  `attendee_name` VARCHAR(120) NOT NULL,
  `attendee_email` VARCHAR(255) NOT NULL,
  `attendee_phone` VARCHAR(20) NOT NULL,
  `unit_price_paise` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_tier_id` (`tier_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_tier` FOREIGN KEY (`tier_id`) REFERENCES `ticket_tiers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table `tickets`
-- -----------------------------------------------------------------------------
CREATE TABLE `tickets` (
  `id` VARCHAR(36) NOT NULL,
  `order_item_id` VARCHAR(36) NOT NULL,
  `order_id` VARCHAR(36) NOT NULL,
  `event_id` VARCHAR(36) NOT NULL,
  `tier_id` VARCHAR(36) NOT NULL,
  `ticket_code` VARCHAR(64) NOT NULL,
  `security_hash` VARCHAR(128) NOT NULL,
  `status` ENUM('valid', 'used', 'void') NOT NULL DEFAULT 'valid',
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tickets_order_item` (`order_item_id`),
  UNIQUE KEY `uq_tickets_code` (`ticket_code`),
  KEY `idx_tickets_order_id` (`order_id`),
  KEY `idx_tickets_event_id` (`event_id`),
  KEY `idx_tickets_tier_id` (`tier_id`),
  CONSTRAINT `fk_tickets_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tickets_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tickets_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_tickets_tier` FOREIGN KEY (`tier_id`) REFERENCES `ticket_tiers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table `checkins`
-- -----------------------------------------------------------------------------
CREATE TABLE `checkins` (
  `id` VARCHAR(36) NOT NULL,
  `ticket_id` VARCHAR(36) NOT NULL,
  `event_id` VARCHAR(36) NOT NULL,
  `scanned_by` VARCHAR(36) NOT NULL,
  `status` ENUM('SUCCESS', 'ALREADY_USED', 'INVALID', 'WRONG_EVENT') NOT NULL,
  `scan_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `device_info` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_checkins_event_id` (`event_id`),
  KEY `idx_checkins_ticket_id` (`ticket_id`),
  KEY `idx_checkins_scanned_by` (`scanned_by`),
  CONSTRAINT `fk_checkins_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_checkins_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_checkins_scanner` FOREIGN KEY (`scanned_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table structure for table `audit_log`
-- -----------------------------------------------------------------------------
CREATE TABLE `audit_log` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(36) DEFAULT NULL,
  `payload` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user_id` (`user_id`),
  KEY `idx_audit_entity` (`entity_type`, `entity_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- SEED DATA INSERTS
-- Matching our development environment and live API catalog
-- -----------------------------------------------------------------------------

-- 1. Users
-- Passwords:
-- Admin:      Admin@PulsePass2026!
-- Organizers: Org@PulsePass2026!
-- Attendees:  User@PulsePass2026!
INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `phone`, `role`, `created_at`, `updated_at`) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@pulsepass.dev', '$2b$10$UB29MieQmBeB55ncbo8TC.AiwS/M/YURnnwVYO7MbFRIXZk2o9IlC', 'Devendra Rathore', '9811122233', 'admin', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('22222222-2222-2222-2222-222222222221', 'organizer.hyderabad@pulsepass.dev', '$2b$10$VDHBOVTYzJYIbCxizFGrTOm81s681yiNJoLXjdvb8t0zrj9W0WbZO', 'Tarun Reddy', '9849011223', 'organizer', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('22222222-2222-2222-2222-222222222222', 'organizer.bengaluru@pulsepass.dev', '$2b$10$VDHBOVTYzJYIbCxizFGrTOm81s681yiNJoLXjdvb8t0zrj9W0WbZO', 'Sneha Rao', '9880199887', 'organizer', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('33333333-3333-3333-3333-333333333331', 'rishika@pulsepass.dev', '$2b$10$N7x4hP2CMHq0A2NqztvXo.Ek2P55ZJAPpsjZmv2nuSD3xmCDmFvde', 'Rishika Deshmukh', '9876543210', 'attendee', '2026-10-02 00:00:00', '2026-10-02 00:00:00'),
('33333333-3333-3333-3333-333333333332', 'aditya.sharma@pulsepass.dev', '$2b$10$N7x4hP2CMHq0A2NqztvXo.Ek2P55ZJAPpsjZmv2nuSD3xmCDmFvde', 'Aditya Sharma', '9849012345', 'attendee', '2026-10-02 00:00:00', '2026-10-02 00:00:00'),
('33333333-3333-3333-3333-333333333333', 'priya.nair@pulsepass.dev', '$2b$10$N7x4hP2CMHq0A2NqztvXo.Ek2P55ZJAPpsjZmv2nuSD3xmCDmFvde', 'Priya Nair', '9701234567', 'attendee', '2026-10-02 00:00:00', '2026-10-02 00:00:00'),
('33333333-3333-3333-3333-333333333334', 'karan.verma@pulsepass.dev', '$2b$10$N7x4hP2CMHq0A2NqztvXo.Ek2P55ZJAPpsjZmv2nuSD3xmCDmFvde', 'Karan Verma', '9988776655', 'attendee', '2026-10-02 00:00:00', '2026-10-02 00:00:00'),
('33333333-3333-3333-3333-333333333335', 'ananya.kulkarni@pulsepass.dev', '$2b$10$N7x4hP2CMHq0A2NqztvXo.Ek2P55ZJAPpsjZmv2nuSD3xmCDmFvde', 'Ananya Kulkarni', '9123456780', 'attendee', '2026-10-02 00:00:00', '2026-10-02 00:00:00');

-- 2. Venues
INSERT INTO `venues` (`id`, `name`, `address`, `city`, `state`, `postal_code`, `capacity`, `created_at`) VALUES
('a0000000-0000-0000-0000-000000000001', 'HITEX Exhibition Centre', 'Trade Fair Office Building, IZZAT Nagar', 'Hyderabad', 'Telangana', '500084', 12000, '2026-10-01 00:00:00'),
('a0000000-0000-0000-0000-000000000002', 'Shilpakala Vedika', 'Hitech City Main Road, Madhapur', 'Hyderabad', 'Telangana', '500081', 2500, '2026-10-01 00:00:00'),
('a0000000-0000-0000-0000-000000000003', 'Jayamahal Palace Grounds', 'Near Cantonment Railway Station, Nandi Durga Road', 'Bengaluru', 'Karnataka', '560046', 15000, '2026-10-01 00:00:00'),
('a0000000-0000-0000-0000-000000000004', 'Chowdiah Memorial Hall', '16th Cross, G.D. Park Extension, Vyalikaval', 'Bengaluru', 'Karnataka', '560003', 1000, '2026-10-01 00:00:00'),
('a0000000-0000-0000-0000-000000000005', 'Jio World Garden', 'Plot No: RG1A, G Block BKC, Bandra Kurla Complex', 'Mumbai', 'Maharashtra', '400051', 10000, '2026-10-01 00:00:00'),
('a0000000-0000-0000-0000-000000000006', 'NCPA Tata Theatre', 'NCPA Marg, Nariman Point', 'Mumbai', 'Maharashtra', '400021', 1010, '2026-10-01 00:00:00'),
('a0000000-0000-0000-0000-000000000007', 'Jawaharlal Nehru Stadium Arena', 'Pragati Vihar, Lodhi Road', 'Delhi', 'Delhi', '110003', 25000, '2026-10-01 00:00:00'),
('a0000000-0000-0000-0000-000000000008', 'Siri Fort Auditorium', 'August Kranti Marg, Siri Institutional Area', 'Delhi', 'Delhi', '110049', 1865, '2026-10-01 00:00:00');

-- 3. Events
INSERT INTO `events` (`id`, `organizer_id`, `venue_id`, `title`, `slug`, `description`, `category`, `status`, `start_time`, `end_time`, `doors_open_time`, `age_restriction`, `banner_url`, `is_featured`, `created_at`, `updated_at`) VALUES
('e0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000001', 'Echoes of Deccan: Fusion Music Festival 2026', 'echoes-of-deccan-fusion-fest-2026', 'A three-stage sonic convergence of Carnatic prog-rock, electronic synthesis, and Sufi acoustic ensembles under the Hyderabad night sky.', 'music', 'published', '2026-11-14 17:00:00', '2026-11-14 23:30:00', '2026-11-14 16:00:00', 'All Ages', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', 1, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000002-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000002', 'Deccan Tech Horizon Summit 2026', 'deccan-tech-horizon-summit-2026', 'The annual congregation of high-throughput distributed systems engineers, compiler designers, and decentralized network architects.', 'tech', 'published', '2026-10-25 09:00:00', '2026-10-25 18:00:00', '2026-10-25 08:00:00', 'All Ages', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', 1, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000003-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000001', 'Hyderabad Biryani & Kebab Heritage Carnival', 'hyderabad-biryani-kebab-carnival', 'Over 60 heritage Nizami kitchens present traditional dum pukht gastronomy, charcoal skewers, and artisanal Hyderabadi confections.', 'food', 'published', '2026-11-20 12:00:00', '2026-11-22 23:00:00', '2026-11-20 11:30:00', 'All Ages', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000004-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000002', 'Qawwali Nights at Chowmahalla Gate', 'qawwali-nights-chowmahalla', 'Sufi maestros Warsi Brothers deliver devotional verses and timeless ecstatic harmonies under the velvet Nizami sky.', 'arts', 'published', '2026-12-05 19:00:00', '2026-12-05 22:30:00', '2026-12-05 18:00:00', 'All Ages', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000005-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000002', 'Charminar Classical Kuchipudi Recital', 'charminar-classical-kuchipudi', 'Master dancers present mythological abhinaya and dynamic footwork patterns accompanied by mridangam and violin virtuosos.', 'arts', 'draft', '2026-12-18 18:30:00', '2026-12-18 21:00:00', '2026-12-18 18:00:00', 'All Ages', 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000006-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000003', 'Silicon Sounds: Bengaluru Indie Rock Showcase', 'silicon-sounds-indie-showcase-2026', 'Bengaluru iconic rock outfits and breakthrough bedroom producers share the historic open lawns of Jayamahal Palace.', 'music', 'published', '2026-11-28 16:00:00', '2026-11-28 23:00:00', '2026-11-28 15:00:00', 'All Ages', 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000007-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000004', 'Chowdiah Sitar Duet: Ragas at Twilight', 'chowdiah-sitar-duet-twilight', 'An intimate classical concert in the acoustic marvel of Chowdiah Hall celebrating monsoon and evening ragas.', 'arts', 'published', '2026-10-30 18:30:00', '2026-10-30 21:30:00', '2026-10-30 17:45:00', 'All Ages', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000008-0000-0000-0000-000000000008', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000003', 'Bengaluru Craft Brew & Fermentation Expo', 'bengaluru-craft-brew-expo-2026', 'Twenty-four microbreweries bring their barrel-aged stouts, mango sour ales, and smoked porters paired with artisanal cheese.', 'food', 'published', '2026-11-07 12:00:00', '2026-11-08 22:00:00', '2026-11-07 11:30:00', 'All Ages', 'https://images.unsplash.com/photo-1538488881522-4326c3ccab76?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000009-0000-0000-0000-000000000009', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000004', 'Bengaluru Open Pro Badminton Cup 2026', 'bengaluru-open-pro-badminton-2026', 'Top national shuttlers compete in the fast-paced indoor finals of the Karnataka Invitational Cup.', 'sports', 'published', '2026-12-12 10:00:00', '2026-12-13 20:00:00', '2026-12-12 09:00:00', 'All Ages', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000010-0000-0000-0000-000000000010', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000003', 'Full Stack Systems & WebTech Conclave 2025', 'full-stack-webtech-conclave-2025', 'Deep dives into V8 optimizations, database isolation levels, and browser rendering engines.', 'tech', 'completed', '2025-11-15 09:00:00', '2025-11-15 18:00:00', '2025-11-15 08:30:00', 'All Ages', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000011-0000-0000-0000-000000000011', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000005', 'Mumbai Synthwave & Cyberpunk Gala', 'mumbai-synthwave-cyberpunk-gala', 'Neon visual projections, analog synthesizers, and retro-futuristic basslines taking over Jio World Garden.', 'music', 'published', '2026-11-21 18:00:00', '2026-11-22 01:00:00', '2026-11-21 17:00:00', 'All Ages', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80', 1, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000012-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000006', 'NCPA Symphony Orchestra of India Recital', 'ncpa-soi-autumn-concert', 'Beethoven 7th Symphony and Tchaikovsky Violin Concerto performed by the internationally acclaimed SOI under guest baton.', 'arts', 'published', '2026-10-28 19:00:00', '2026-10-28 21:45:00', '2026-10-28 18:15:00', 'All Ages', 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000013-0000-0000-0000-000000000013', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000005', 'Bombay Coastal Seafood Fiesta', 'bombay-coastal-seafood-fiesta', 'Malvani prawns, butter-garlic crab, and Koli fish fry prepared fresh by generations-old fishing families along BKC.', 'food', 'published', '2026-11-13 12:00:00', '2026-11-15 22:30:00', '2026-11-13 11:30:00', 'All Ages', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000014-0000-0000-0000-000000000014', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000005', 'Mumbai Midnight Marathon & 10K Run', 'mumbai-midnight-marathon-2026', 'The iconic nighttime endurance race through illuminated sea links and coastal boulevards.', 'sports', 'published', '2026-12-19 23:00:00', '2026-12-20 05:00:00', '2026-12-19 21:30:00', 'All Ages', 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000015-0000-0000-0000-000000000015', '22222222-2222-2222-2222-222222222221', 'a0000000-0000-0000-0000-000000000006', 'Bollywood Retro Night: RD Burman Tribute', 'bollywood-retro-rd-burman-tribute', 'Brass sections, live rhythm ensembles, and vintage microphones bringing the 70s golden era back to life.', 'music', 'published', '2026-11-06 19:30:00', '2026-11-06 22:30:00', '2026-11-06 18:30:00', 'All Ages', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000016-0000-0000-0000-000000000016', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000007', 'Capital Soundwave: Electronic & Techno Arena', 'capital-soundwave-techno-arena', 'Twelve hours of relentless warehouse industrial techno and modular synthesizer soundscapes in JLN Stadium.', 'music', 'published', '2026-11-27 16:00:00', '2026-11-28 04:00:00', '2026-11-27 15:00:00', 'All Ages', 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80', 1, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000017-0000-0000-0000-000000000017', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000008', 'Purani Dilli Street Food & Chaat Festival', 'purani-dilli-street-food-festival', 'Daulat ki chaat, stuffed parathas of Gali Paranthe Wali, and kulhad lassi curated by Old Delhi icons.', 'food', 'published', '2026-12-04 11:00:00', '2026-12-06 22:00:00', '2026-12-04 10:30:00', 'All Ages', 'https://images.unsplash.com/photo-1505253758473-96b46deae27c?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000018-0000-0000-0000-000000000018', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000008', 'India International Theatre Festival 2026', 'india-intl-theatre-fest-2026', 'Six premier experimental theatrical productions exploring existentialism, post-colonial history, and interactive monologue.', 'arts', 'published', '2026-12-10 17:30:00', '2026-12-14 22:00:00', '2026-12-10 16:30:00', 'All Ages', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000019-0000-0000-0000-000000000019', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000007', 'National Boxing Championship Bout 2026', 'national-boxing-championship-2026', 'Heavyweight and welterweight title fights featuring top military and state champion pugilists.', 'sports', 'published', '2026-12-26 17:00:00', '2026-12-26 22:30:00', '2026-12-26 16:00:00', 'All Ages', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('e0000020-0000-0000-0000-000000000020', '22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000008', 'Delhi Classical Ghazal Mehfil (Cancelled)', 'delhi-classical-ghazal-mehfil-cancelled', 'Poetic verses of Ghalib and Faiz Ahmed Faiz arranged for sitar, sarangi, and harmonium.', 'arts', 'cancelled', '2026-10-18 19:00:00', '2026-10-18 22:00:00', '2026-10-18 18:00:00', 'All Ages', 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80', 0, '2026-10-01 00:00:00', '2026-10-01 00:00:00');

-- 4. Ticket Tiers
INSERT INTO `ticket_tiers` (`id`, `event_id`, `name`, `description`, `price_paise`, `capacity`, `sold`, `sales_start`, `sales_end`, `created_at`, `updated_at`) VALUES
-- Echoes of Deccan
('t0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 'General Admission', 'Full standing floor entry and main stage access.', 149900, 2000, 480, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000001', 'VIP Pass (Stagefront)', 'Express turnstile lane and elevated viewing lounge.', 349900, 300, 120, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000001', 'Backstage Patron Pass', 'Direct artist green room hospitality access.', 699900, 50, 24, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Deccan Tech Horizon Summit
('t0000002-0000-0000-0000-000000000001', 'e0000002-0000-0000-0000-000000000002', 'Early Bird Delegate', 'All keynote stages and exhibition pass.', 199900, 500, 500, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000002-0000-0000-0000-000000000002', 'e0000002-0000-0000-0000-000000000002', 'Standard Delegate', 'Full 2-day technical track pass and kit bag.', 299900, 1000, 310, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000002-0000-0000-0000-000000000003', 'e0000002-0000-0000-0000-000000000002', 'VIP Access & Dinner', 'Private executive dining with keynote speakers.', 599900, 150, 45, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Hyderabad Biryani Carnival
('t0000003-0000-0000-0000-000000000001', 'e0000003-0000-0000-0000-000000000003', 'Single Day Tasting Pass', 'Entry plus 3 tasting coupons at any kitchen.', 49900, 3000, 1250, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000003-0000-0000-0000-000000000002', 'e0000003-0000-0000-0000-000000000003', 'Weekend Epicurean Pass', 'Unlimited tasting passes and chef table access.', 99900, 1000, 610, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Qawwali Nights at Chowmahalla
('t0000004-0000-0000-0000-000000000001', 'e0000004-0000-0000-0000-000000000004', 'Baithak Seating', 'Traditional floor cushion baithak seating.', 89900, 800, 800, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000004-0000-0000-0000-000000000002', 'e0000004-0000-0000-0000-000000000004', 'Diwan Premium', 'Elevated royal divan seating with tea service.', 189900, 200, 200, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Charminar Kuchipudi
('t0000005-0000-0000-0000-000000000001', 'e0000005-0000-0000-0000-000000000005', 'Auditorium Seating', 'Standard numbered auditorium seat.', 49900, 600, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Silicon Sounds Bengaluru
('t0000006-0000-0000-0000-000000000001', 'e0000006-0000-0000-0000-000000000006', 'Lawn Standing', 'Sprawling grass area open to stage view.', 99900, 4000, 1850, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000006-0000-0000-0000-000000000002', 'e0000006-0000-0000-0000-000000000006', 'Front Pit Pass', 'Dedicated barricade-adjacent enclosure.', 249900, 600, 340, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000006-0000-0000-0000-000000000003', 'e0000006-0000-0000-0000-000000000006', 'VIP Lounge & Bar', 'Elevated viewing deck with complimentary bar.', 499900, 100, 88, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Chowdiah Sitar Duet
('t0000007-0000-0000-0000-000000000001', 'e0000007-0000-0000-0000-000000000007', 'Balcony Pass', 'Clear acoustic tier balcony seat.', 65000, 350, 280, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000007-0000-0000-0000-000000000002', 'e0000007-0000-0000-0000-000000000007', 'Orchestra Front', 'Front 8 rows acoustic immersion.', 150000, 250, 190, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Bengaluru Craft Brew Expo
('t0000008-0000-0000-0000-000000000001', 'e0000008-0000-0000-0000-000000000008', 'Brewer Tasting Glass & 5 Tokens', 'Official tasting tulip glass with 5 drink tokens.', 120000, 2500, 980, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000008-0000-0000-0000-000000000002', 'e0000008-0000-0000-0000-000000000008', 'All-Weekend Brewer Pass', 'Access both days with 15 tasting tokens.', 220000, 800, 410, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Bengaluru Open Badminton
('t0000009-0000-0000-0000-000000000001', 'e0000009-0000-0000-0000-000000000009', 'Courtside Box', 'Front row court action pass.', 180000, 150, 90, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000009-0000-0000-0000-000000000002', 'e0000009-0000-0000-0000-000000000009', 'General Bleachers', 'Numbered upper tier bleacher seat.', 50000, 600, 340, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Full Stack Systems Conclave
('t0000010-0000-0000-0000-000000000001', 'e0000010-0000-0000-0000-000000000010', 'Standard Ticket', 'Delegate badge and proceedings archive.', 150000, 800, 800, '2025-01-01 00:00:00', '2025-12-31 23:59:59', '2025-10-01 00:00:00', '2025-10-01 00:00:00'),

-- Mumbai Synthwave Gala
('t0000011-0000-0000-0000-000000000001', 'e0000011-0000-0000-0000-000000000011', 'Cyber GA Pass', 'Floor access and holographic projection zone.', 129900, 3000, 1120, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000011-0000-0000-0000-000000000002', 'e0000011-0000-0000-0000-000000000011', 'VIP Neon Deck', 'Elevated mezzanine with private bar.', 349900, 400, 290, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- NCPA Symphony Orchestra
('t0000012-0000-0000-0000-000000000001', 'e0000012-0000-0000-0000-000000000012', 'Dress Circle', 'Acoustic golden circle seating.', 200000, 300, 295, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000012-0000-0000-0000-000000000002', 'e0000012-0000-0000-0000-000000000012', 'Stalls Premium', 'Front stalls prime auditorium seat.', 450000, 250, 250, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Bombay Coastal Seafood
('t0000013-0000-0000-0000-000000000001', 'e0000013-0000-0000-0000-000000000013', 'Entry + Welcome Platter', 'Festival gate entry with signature starter.', 79900, 2000, 840, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000013-0000-0000-0000-000000000002', 'e0000013-0000-0000-0000-000000000013', 'Unlimited Catch Pass', 'All-you-can-taste pass across 20 stalls.', 199900, 500, 320, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Mumbai Midnight Marathon
('t0000014-0000-0000-0000-000000000001', 'e0000014-0000-0000-0000-000000000014', '10K Challenge Pass', 'Timed bib, race jersey, and finisher medal.', 95000, 2000, 1400, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000014-0000-0000-0000-000000000002', 'e0000014-0000-0000-0000-000000000014', 'Full Marathon 42K Entry', 'Official timing chip and race hospitality.', 165000, 1000, 610, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Bollywood Retro Night
('t0000015-0000-0000-0000-000000000001', 'e0000015-0000-0000-0000-000000000015', 'Balcony Classic', 'Auditorium upper tier balcony seat.', 99900, 400, 380, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000015-0000-0000-0000-000000000002', 'e0000015-0000-0000-0000-000000000015', 'VIP Front Row', 'Prime front row seat with meet & greet.', 299900, 150, 150, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Capital Soundwave Delhi
('t0000016-0000-0000-0000-000000000001', 'e0000016-0000-0000-0000-000000000016', 'Arena General Admission', 'Stadium turf access with surround audio.', 189900, 5000, 2200, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000016-0000-0000-0000-000000000002', 'e0000016-0000-0000-0000-000000000016', 'Stage VIP Deck', 'Elevated side-stage deck with private restrooms.', 449900, 800, 510, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Purani Dilli Food Festival
('t0000017-0000-0000-0000-000000000001', 'e0000017-0000-0000-0000-000000000017', 'Day Pass + 4 Food Coupons', 'Entry pass plus 4 tasting coupons.', 59900, 2000, 1100, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000017-0000-0000-0000-000000000002', 'e0000017-0000-0000-0000-000000000017', 'VIP Priority Line Pass', 'Zero-wait express lane at all 30 iconic stalls.', 119900, 400, 290, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- India International Theatre
('t0000018-0000-0000-0000-000000000001', 'e0000018-0000-0000-0000-000000000018', 'Balcony Seat', 'Standard tiered balcony seat.', 75000, 600, 410, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000018-0000-0000-0000-000000000002', 'e0000018-0000-0000-0000-000000000018', 'Front Orchestra', 'Central auditorium orchestra stall seating.', 180000, 400, 320, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- National Boxing Championship
('t0000019-0000-0000-0000-000000000001', 'e0000019-0000-0000-0000-000000000019', 'Ringside Row 1-3', 'Prime ringside action seat.', 350000, 100, 85, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),
('t0000019-0000-0000-0000-000000000002', 'e0000019-0000-0000-0000-000000000019', 'Upper Bowl Bleachers', 'Stadium numbered bleacher seat.', 80000, 1500, 920, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00'),

-- Delhi Classical Ghazal
('t0000020-0000-0000-0000-000000000001', 'e0000020-0000-0000-0000-000000000020', 'General Admission', 'General auditorium seat.', 90000, 500, 0, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-10-01 00:00:00', '2026-10-01 00:00:00');

-- 5. Sample Reservation, Order, Order Items & Tickets (Attendee: Rishika)
INSERT INTO `reservations` (`id`, `user_id`, `tier_id`, `quantity`, `status`, `expires_at`, `created_at`) VALUES
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333331', 't0000001-0000-0000-0000-000000000001', 2, 'completed', '2026-11-14 18:00:00', '2026-10-05 12:00:00');

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `event_id`, `reservation_id`, `total_amount_paise`, `status`, `payment_method`, `payment_ref`, `created_at`) VALUES
('66666666-6666-6666-6666-666666666666', 'PNP-2026-HYD8901', '33333333-3333-3333-3333-333333333331', 'e0000001-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 299800, 'confirmed', 'SIMULATED_UPI', 'UPI-REF-20261005-9988', '2026-10-05 12:02:00');

INSERT INTO `order_items` (`id`, `order_id`, `tier_id`, `attendee_name`, `attendee_email`, `attendee_phone`, `unit_price_paise`, `created_at`) VALUES
('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666666', 't0000001-0000-0000-0000-000000000001', 'Rishika Deshmukh', 'rishika@pulsepass.dev', '9876543210', 149900, '2026-10-05 12:02:00'),
('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666666', 't0000001-0000-0000-0000-000000000001', 'Aarav Deshmukh', 'aarav.deshmukh@pulsepass.dev', '9876543211', 149900, '2026-10-05 12:02:00');

INSERT INTO `tickets` (`id`, `order_item_id`, `order_id`, `event_id`, `tier_id`, `ticket_code`, `security_hash`, `status`, `used_at`, `created_at`) VALUES
('88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666666', 'e0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000001', 'PNP-TK-8901-A1B2C3D4', 'hash-sig-demo-01', 'valid', NULL, '2026-10-05 12:02:00'),
('88888888-8888-8888-8888-888888888882', '77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666666', 'e0000001-0000-0000-0000-000000000001', 't0000001-0000-0000-0000-000000000001', 'PNP-TK-8901-E5F6G7H8', 'hash-sig-demo-02', 'used', '2026-10-05 18:14:00', '2026-10-05 12:02:00');

-- 6. Sample Checkin Record
INSERT INTO `checkins` (`id`, `ticket_id`, `event_id`, `scanned_by`, `status`, `scan_timestamp`, `device_info`, `notes`) VALUES
('99999999-9999-9999-9999-999999999991', '88888888-8888-8888-8888-888888888882', 'e0000001-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222221', 'SUCCESS', '2026-10-05 18:14:00', 'Turnstile Gate Scanner Lane 2 (iOS / WebKit)', 'Scanned successfully at Gate 2');

-- -----------------------------------------------------------------------------
-- Re-enable Foreign Key Checks and Commit
-- -----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
