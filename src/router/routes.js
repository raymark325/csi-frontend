const routes = [
  {
    path: '/',
    component: () => import('@/pages/LandingPage.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', component: () => import('@/pages/IndexPage.vue') },
      { path: 'lms', component: () => import('@/pages/LMS/LMSCoursesPage.vue') },
      { path: 'lms/course/:id', component: () => import('@/pages/LMS/ModulesPage.vue') },
      { path: 'lms/modules/:id', component: () => import('@/pages/LMS/ModuleDetailPage.vue') },
      { path: 'lms/master-course/:id', component: () => import('@/pages/LMS/MasterModulesPage.vue') },
      { path: 'lms/master-modules/:id', component: () => import('@/pages/LMS/MasterModuleDetailPage.vue') },
      { path: 'lms/lab', component: () => import('@/pages/LMS/CodingLabPage.vue') },
      { path: 'assignments', component: () => import('@/pages/LMS/AssignmentCoursesPage.vue') },
      { path: 'assignments/course/:id', component: () => import('@/pages/LMS/AssignmentsPage.vue') },
      { 
        path: 'lms/submissions', 
        component: () => import('@/pages/LMS/SubmissionsPage.vue'),
        meta: { roles: ['teacher', 'admin'] }
      },
      { path: 'grading', component: () => import('@/pages/GradingSystem/GradingCoordinatorPage.vue') },
      { 
        path: 'grading/weights', 
        component: () => import('@/pages/GradingSystem/CategoryManagementPage.vue'),
        meta: { roles: ['teacher', 'admin'] }
      },
      { path: 'attendance', component: () => import('@/pages/Attendance/AttendanceCoordinatorPage.vue') },
      { path: 'reports', component: () => import('@/pages/Reports/GradeReportPage.vue') },
      { path: 'announcements', component: () => import('@/pages/Announcements/AnnouncementsPage.vue') },
      { 
        path: 'admin/users', 
        component: () => import('@/pages/Admin/UserManagementPage.vue'),
        meta: { roles: ['admin', 'registrar'] }
      },
      { 
        path: 'admin/courses', 
        component: () => import('@/pages/Admin/CourseManagementPage.vue'),
        meta: { roles: ['admin', 'registrar'] }
      },
      { 
        path: 'admin/sections', 
        component: () => import('@/pages/Admin/SectionManagementPage.vue'),
        meta: { roles: ['admin', 'registrar'] }
      },
      { 
        path: 'admin/settings', 
        component: () => import('@/pages/Admin/SystemSettingsPage.vue'),
        meta: { roles: ['admin'] }
      },
      { 
        path: 'admin/semesters', 
        component: () => import('@/pages/Admin/SemesterManagementPage.vue'),
        meta: { roles: ['admin'] }
      },
    ],
  },
  {
    path: '/login',
    component: () => import('@/pages/Auth/LoginPage.vue'),
  },
  {
    path: '/register',
    component: () => import('@/pages/Auth/RegisterPage.vue'),
  },
  {
    path: '/forgot-password',
    component: () => import('@/pages/Auth/ForgotPasswordPage.vue'),
  },
  {
    path: '/maintenance',
    component: () => import('@/pages/MaintenancePage.vue'),
    meta: { public: true }
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue'),
  }
];

export default routes;
