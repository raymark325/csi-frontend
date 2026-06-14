# CSI Frontend Structure

This is the Vue 3 + Quasar framework web application for Classroom Student Integration (CSI).

## Directory Layout

- `src/layouts/`: MainLayout for top header and responsive side drawer.
- `src/pages/`:
  - `Auth/`: LoginPage.
  - `Dashboard/`: Dashboard views for Student and Teacher.
  - `LMS/`: Modules, Assignments, Submissions review, and Monaco-based Coding Lab.
  - `GradingSystem/`: Gradebook, category weighting management, and student grade card.
  - `Attendance/`: Class attendance sheets and history logs.
- `src/components/`:
  - Modularized reusable widgets like `GradeTable`, `WeightingPanel`, `ModuleCard`, `ReportExporter`, etc.
- `src/stores/`: Pinia stores for local caching, state management, and polling-based toast notifications.
- `src/services/`: Services for Axios API interactions, report printing, and IndexedDB offline caching.
