# LCN Auto-Book System

An automated, serverless booking system designed to autonomously schedule and manage classes on the LCN Idiomas platform. This system bypasses the limitations of the official web interface's recommendation engine to provide precise, real-time class booking.

---

## System Architecture

The entire system operates 100% serverless on Supabase, ensuring high availability without the need for local scripts or background processes on a personal computer.

The architecture consists of three main components:
1. **Database (Supabase PostgreSQL):** 
    - `student_config`: Stores scheduling preferences (allowed hour ranges, permitted days, target headquarters, and course level).
    - `booking_logs`: Functions as the system's memory and operational log. It records successful bookings and learns from rejections to prevent API spam.
2. **Execution Engine (Edge Function - TypeScript):** A cloud-hosted function (`auto-book/index.ts`) that contains the core logic for filtering available classes, authenticating via Laravel Sanctum, and executing asynchronous booking requests.
3. **Scheduler (pg_cron):** A background PostgreSQL process that invokes the Edge Function exactly every minute on weekdays (`* * * * 1-5`), ensuring constant vigilance over the platform's schedule board.

---

## Technical Insights & Reverse Engineering

During the development of this system, several insights regarding the LCN backend were discovered and accounted for:

* **Sanctum API Authentication:** The platform utilizes modern Laravel Sanctum authentication relying on CSRF Tokens and Cookies. To book a class, the system sequentially requests a CSRF cookie and authenticates to retrieve the necessary session headers.
* **Direct Schedule Access:** The official web interface's recommendation endpoint (`/suggest-class-schedule`) often obscures available classes. This system bypasses it entirely by fetching the raw, unfiltered calendar directly from `/api/schedules/between-dates`.
* **Ghost Classes Handling:** The backend occasionally publishes empty classes (0/6 capacity) that have not yet been assigned a teacher. Attempting to book these results in an internal rejection (`"No se encontró un profesor disponible. 3"`). The system logs this failure but continuously monitors the class, instantly securing the booking the moment an administrator assigns a teacher.

---

## Core Logic & Operations

### 1. Rolling Time Window
The system perpetually scans a 3-day window: the current day, tomorrow, and the day after tomorrow. This window advances automatically at midnight.

### 2. Resource Management & Rate Limiting
To prevent account restrictions and avoid unnecessary API loads, the system avoids authenticating every single minute. It calculates the current time and executes full logic only during strategic moments:
- **Exact Opening Minutes:** 09:00, 10:30, 12:00, 13:30.
- **Immediate Follow-up:** +1 minute.
- **Backoff Sweeps:** +2, +3, +5, +10, and +20 minutes post-opening.
- **Routine Patrols:** Every hour and half-hour mark.
Executions outside these specific times are silently skipped before authentication occurs.

### 3. Asynchronous Burst Mode
At the exact moment of class releases (e.g., 09:00:00), the system enters Burst Mode. It dispatches asynchronous requests at 0s, 10s, 20s, 30s, 40s, and 50s. If multiple targeted classes are available across the 3-day window, the system handles booking them simultaneously in parallel.

### 4. Dynamic Blacklisting (`ALREADY_BOOKED`)
When the system attempts to book a class that the user has already manually reserved, the API responds indicating a schedule conflict. The system captures the class ID and stores it in the database with an `ALREADY_BOOKED` status. From that moment on, the system entirely ignores that class, focusing its computational power strictly on securing the remaining unbooked slots.

---

## Repository Structure

The codebase is organized into a modular standard:

* **`/database`**: Core SQL files.
    * `schema.sql`: Table definitions and schema structure.
    * `setup_definitivo_lcn.sql`: Deployment script to initialize the cron job and configure the student's radar parameters.
* **`/supabase/functions/auto-book`**: Contains the live TypeScript Edge Function (`index.ts`).
* **`/tests`**: Local Node.js scripts developed during engineering to validate algorithms, monitor real-time board states, and debug logic constraints.
* **`/scripts-investigacion`**: Initial Python and JS scraping scripts utilized for the reverse engineering of LCN's headers and session states.
* **`/lcn-scheduler`**: Legacy local version operated via PM2/Terminal, preserved for redundancy.

---

## Deployment

To push changes or updates to the Edge Function, utilize the Supabase CLI:

```bash
supabase functions deploy auto-book --project-ref <your-project-ref>
```
