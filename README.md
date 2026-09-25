# RISE A CHILD CHILDREN HOME - Official Management & Information Portal

A modern, professional, responsive Hostel Management and Information Website for **RISE A CHILD CHILDREN HOME**, founded by **BRO .NELSON**. Built according to strict institutional requirements, with complete database persistence, administrative dashboard, child privacy shielding, automated admission notifications, and public status tracking.

---

## 🌟 Highlights & Features

1. **Website Navigation**:
   - Header with quick contact links, accreditation badge, and navigation tabs:
     - **Home**
     - **Staff**
     - **Licence**
     - **Children's**
     - **Views**
     - **Admissions**
     - **Needed**
     - **Time Table** & **Food Menu** (accessible via Schedules menu or direct tabs)
     - **Staff / Admin Login**
   - Responsive mobile sliding drawer with overlay.

2. **Home Page**:
   - **Hero Section**: Prominent hostel logo, welcoming background photograph with dark readable overlay, welcoming headline, introduction, and "Explore Our Hostel" CTA button.
   - **Vision Section**: Dedicated vision card with 4 foundational pillars: Safety & Care, Quality Education, Health & Nutrition, and Moral Character.
   - **Founder Section**: 2-column balanced layout with circular founder portrait, biography, vision quote, and message to children, parents, and supporters.
   - **Events / Gallery**: Visually balanced alongside the Founder section to end at approximately the same height, showcasing milestone celebrations with fullscreen lightbox.
   - **Hostel Video**: Dedicated section with custom HTML5 video player (Play/Pause, Volume, Seek progress bar, Fullscreen) playing directly on site without external redirection.

3. **Staff Page**:
   - Profile cards for all hostel staff (Warden, Academic Head, Medical Doctor, Counselor, Head Chef, Sports Coach, Arts Coordinator, Safety Supervisor).
   - Clickable mobile direct phone dialer (`tel:`) and email (`mailto:`).
   - Interactive bio & responsibility modal on card click.
   - Admin can add, edit, and delete staff profiles.

4. **Licence Page**:
   - Official statutory certification under JJ Act 2015 with issuing authority, dates, and active verification badge.
   - Zoomable official certificate document preview and download option.
   - Admin update capability with new certificate upload.

5. **Children's Directory with Responsible Privacy Protection**:
   - **Total Children: 120** counter updating dynamically from the SQLite database.
   - Search by name or ID, filter by class and gender, and pagination (12 per page).
   - Toggle between responsive **Card Grid** and **Table View**.
   - **Privacy Shield**: Sensitive guardian phone numbers, home addresses, and confidential medical records are securely masked for public visitors. Staff/Admins can unlock full records.

6. **Campus Views & Facilities**:
   - Categorized facility galleries: **Rooms**, **Dining Area**, **Bathrooms**, **Playground**, **Kitchen**, and **Other Facilities / Computer Lab**.
   - Fullscreen lightbox photo gallery with previous/next controls and keyboard navigation.
   - Admin can create new custom categories and upload photos with captions.

7. **Admissions & Instructions**:
   - Clean professional online admission form with validation: Child name, age, DOB, class, gender, address, guardian contact, photo, reason, and referral source.
   - Real-time database storage, application reference ID (e.g. `ADM-2026-0041`), and simulated email dispatch notification to the configured hostel email.
   - **Do's and Don'ts**: Clear side-by-side rules card (daily discipline, respect, routine vs. prohibited conduct).
   - Admin application workflow: search, filter by status (Pending, Under Review, Accepted, Rejected), view dossiers, and log notes.

8. **Time Table & Food Menu**:
   - **Time Table**: 5:30 AM to 9:30 PM balanced daily schedule with admin add/edit/delete controls.
   - **Food Menu**: Complete weekly meal chart (Monday to Sunday) covering Breakfast, Lunch, Evening Snacks, and Dinner with admin editing.

9. **Important Message / Restriction Gate**:
   - Campus code of conduct & child safety acceptance modal ("Please read and accept the hostel instructions before continuing") with Accept & Continue and Cancel buttons, recording consent.

10. **Needed & Support Page**:
    - **Needed Items Table**: Serial No., Item Name, Category, Quantity Needed, Fulfilled Quantity, Estimated Price in ₹ INR, Urgency, and "Pledge/Donate" button.
    - **Support / Donation**: Prominent UPI QR code, UPI ID (`shantiniketan@sbi`), Google Pay, PhonePe, and Bank details, plus instant mobile `upi://` trigger.
    - **Formal Receipt Generator**: Supporters can register donations and print official receipts.
    - **Wall of Gratitude ("People Who Supported Us")**: Cards featuring donors, doctors, and benefactors with photos and messages.

11. **Admin Dashboard**:
    - Password-protected unified console to manage all site settings, hero banner, founder info, video, staff, licence, children, facility views, admissions workflow, timetables, food menus, needs, supporters, and UPI details.

---

## 🚀 How to Run

### Option 1: 1-Click Windows Launcher
Double click `start.bat` in this folder. It will start the server and automatically open the portal in your browser at `http://localhost:5000`.

### Option 2: Manual Terminal Execution
```bash
# Start Backend & Unified Server (Port 5000)
cd server
node src/server.js

# Or start React Vite Dev Server with live reload (Port 5173)
cd client
npm run dev
```

---

## 🔐 Default Administrator Login
- **Username**: `admin`
- **Password**: `admin123`
*(Can be changed anytime inside the Admin Portal)*
