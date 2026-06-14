<template>
  <q-page class="bg-gradient-mesh" style="min-height: 100vh; padding: 0;">
    <!-- ── Hero Banner ──────────────────────────────── -->
    <div
      style="
        background: linear-gradient(135deg, rgba(0,122,255,0.10) 0%, rgba(255,59,48,0.07) 100%);
        border-bottom: 1px solid var(--border-color);
        padding: 48px 40px 40px;
      "
    >
      <div class="row items-center justify-between q-mb-md">
        <div>
          <p class="text-label q-mb-xs" style="color: var(--sms-blue);">CSI UNIFIED STUDENT SERVICES AND ACADEMIC PLATFORM</p>
          <h1 class="text-display q-mb-sm" style="margin: 0;">
            <span class="text-gradient-blue">Design</span>
            <span style="color: var(--text-primary);"> System</span>
          </h1>
          <p class="text-body" style="color: var(--text-secondary); margin: 0;">
            Futuristic · Glassmorphism · Apple-Inspired
          </p>
        </div>
        <!-- Dark Mode Toggle -->
        <q-btn
          :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
          :label="$q.dark.isActive ? 'Light' : 'Dark'"
          class="glass-card"
          style="padding: 10px 20px; border: none;"
          flat
          rounded
          @click="$q.dark.toggle()"
        />
      </div>
    </div>

    <!-- ── Main Content ────────────────────────────── -->
    <div style="padding: 40px; max-width: 1280px; margin: 0 auto;">

      <!-- ── 1. Colors ─────────────────────────────── -->
      <ComponentSection title="Color Palette" icon="palette">
        <div class="row q-gutter-md">
          <ColorSwatch color="#007AFF" label="Azure Blue" var="--sms-blue"/>
          <ColorSwatch color="#5AC8FA" label="Blue Light" var="--sms-blue-light"/>
          <ColorSwatch color="#FF3B30" label="Crimson Red" var="--sms-red"/>
          <ColorSwatch color="#FF6961" label="Red Light" var="--sms-red-light"/>
          <ColorSwatch color="#34C759" label="Success" var="--color-success"/>
          <ColorSwatch color="#FF9500" label="Warning" var="--color-warning"/>
          <ColorSwatch color="#F5F7FA" label="Off White" var="--sms-off-white" :dark-border="true"/>
          <ColorSwatch color="#0A0F1E" label="Dark Base" var="--surface-bg-dark"/>
        </div>
      </ComponentSection>

      <!-- ── 2. Typography ─────────────────────────── -->
      <ComponentSection title="Typography" icon="text_fields">
        <div class="glass-card q-pa-lg">
          <p class="text-display q-mb-sm">Display — 48px/800</p>
          <p class="text-headline q-mb-sm">Headline — 32px/700</p>
          <p class="text-title q-mb-sm">Title — 22px/700</p>
          <p class="text-subtitle q-mb-sm">Subtitle — 17px/600</p>
          <p class="text-body q-mb-sm">Body — Regular paragraph text at 15px/400. The quick brown fox jumps over the lazy dog.</p>
          <p class="text-caption q-mb-sm">Caption — Secondary supporting text at 13px</p>
          <p class="text-label">Label — All Caps Label 11px/700</p>
          <hr class="section-divider">
          <p class="text-headline q-mb-xs"><span class="text-gradient-blue">Gradient Blue</span> — Text</p>
          <p class="text-headline"><span class="text-gradient-red">Gradient Red</span> — Text</p>
        </div>
      </ComponentSection>

      <!-- ── 3. Buttons ────────────────────────────── -->
      <ComponentSection title="Buttons" icon="smart_button">
        <div class="glass-card q-pa-lg">
          <div class="row q-gutter-md items-center q-mb-lg">
            <button class="btn-primary">
              <q-icon name="add" size="16px"/> Primary Action
            </button>
            <button class="btn-danger">
              <q-icon name="delete" size="16px"/> Danger Action
            </button>
            <button class="btn-glass">
              <q-icon name="filter_list" size="16px"/> Glass Action
            </button>
          </div>
          <p class="text-label q-mb-md">Quasar Integration</p>
          <div class="row q-gutter-md items-center">
            <q-btn label="Submit" color="primary" rounded unelevated style="border-radius: var(--radius-full)"/>
            <q-btn label="Cancel" rounded flat style="color: var(--text-secondary)"/>
            <q-btn label="Delete" rounded unelevated color="negative"/>
            <q-btn rounded flat icon="notifications" style="color: var(--sms-blue)"/>
            <q-btn icon="more_vert" round flat style="color: var(--text-secondary)"/>
          </div>
        </div>
      </ComponentSection>

      <!-- ── 4. Glass Cards ─────────────────────────── -->
      <ComponentSection title="Glass Cards" icon="dashboard">
        <div class="row q-gutter-md">
          <!-- Stat Cards -->
          <div class="col glass-card stat-card">
            <div class="stat-icon stat-icon--blue"><q-icon name="group" size="22px"/></div>
            <div>
              <p class="text-label q-mb-xs">Total Students</p>
              <p class="text-title q-mb-0" style="font-size:28px; font-weight:800;">1,240</p>
              <p style="color: var(--color-success); font-size:12px; font-weight:600; margin:4px 0 0;">↑ 12% this sem</p>
            </div>
          </div>
          <div class="col glass-card stat-card">
            <div class="stat-icon stat-icon--red"><q-icon name="menu_book" size="22px"/></div>
            <div>
              <p class="text-label q-mb-xs">Total Sections</p>
              <p class="text-title q-mb-0" style="font-size:28px; font-weight:800;">3</p>
              <p style="color: var(--text-muted); font-size:12px; margin:4px 0 0;">Active classes</p>
            </div>
          </div>
          <div class="col glass-card stat-card">
            <div class="stat-icon stat-icon--green"><q-icon name="assignment_turned_in" size="22px"/></div>
            <div>
              <p class="text-label q-mb-xs">Submissions</p>
              <p class="text-title q-mb-0" style="font-size:28px; font-weight:800;">847</p>
              <p style="color: var(--color-success); font-size:12px; font-weight:600; margin:4px 0 0;">↑ 5% this week</p>
            </div>
          </div>
          <div class="col glass-card stat-card">
            <div class="stat-icon stat-icon--orange"><q-icon name="pending" size="22px"/></div>
            <div>
              <p class="text-label q-mb-xs">Pending Tasks</p>
              <p class="text-title q-mb-0" style="font-size:28px; font-weight:800;">24</p>
              <p style="color: var(--color-warning); font-size:12px; font-weight:600; margin:4px 0 0;">Needs attention</p>
            </div>
          </div>
        </div>

        <!-- Feature Card -->
        <div class="row q-gutter-md q-mt-md">
          <div class="col-6 glass-card q-pa-xl">
            <div class="row items-center q-mb-md" style="gap:12px">
              <div class="stat-icon stat-icon--blue"><q-icon name="grade" size="22px"/></div>
              <div>
                <p class="text-subtitle q-mb-0">Grade Sheet — Java</p>
                <p class="text-caption q-mb-0">Grade 12 · Semester 1 · Period 1</p>
              </div>
            </div>
            <div class="row q-gutter-sm q-mb-md">
              <span class="badge badge-blue">Written Works — 15%</span>
              <span class="badge badge-red">Performance — 65%</span>
              <span class="badge badge-orange">Exam — 20%</span>
            </div>
            <div class="progress-track q-mb-xs">
              <div class="progress-fill bg-gradient-primary" style="width: 76%;"></div>
            </div>
            <p class="text-caption">Class Average: 76.4%</p>
          </div>
          <div class="col glass-card q-pa-xl" style="display:flex; flex-direction:column; justify-content: space-between;">
            <p class="text-label q-mb-sm" style="color: var(--sms-blue)">UPCOMING DEADLINE</p>
            <p class="text-title q-mb-xs">Activity 3 — SQL Joins</p>
            <p class="text-caption q-mb-md">Due in <strong style="color: var(--sms-red)">2 days</strong></p>
            <button class="btn-primary" style="align-self: flex-start">
              <q-icon name="open_in_new" size="15px"/> View Task
            </button>
          </div>
        </div>
      </ComponentSection>

      <!-- ── 5. Badges & Status ─────────────────────── -->
      <ComponentSection title="Badges & Status" icon="label">
        <div class="glass-card q-pa-lg">
          <div class="row q-gutter-md items-center q-mb-lg">
            <span class="badge badge-blue">Enrolled</span>
            <span class="badge badge-red">Absent</span>
            <span class="badge badge-green">Present</span>
            <span class="badge badge-orange">Late</span>
            <span class="badge" style="background: rgba(90,200,250,0.12); color: #5AC8FA;">Excused</span>
          </div>
          <p class="text-label q-mb-md">Q-Chip Integration</p>
          <div class="row q-gutter-sm">
            <q-chip color="primary" text-color="white" icon="school" label="Grade 12"/>
            <q-chip color="negative" text-color="white" icon="warning" label="Failed"/>
            <q-chip color="positive" text-color="white" icon="check_circle" label="Passed"/>
            <q-chip icon="pending" label="Pending" style="background: var(--glass-bg); border: 1px solid var(--border-color)"/>
          </div>
        </div>
      </ComponentSection>

      <!-- ── 6. Form Inputs ─────────────────────────── -->
      <ComponentSection title="Form Inputs" icon="edit_note">
        <div class="glass-card q-pa-lg">
          <div class="row q-gutter-md q-mb-md">
            <div class="col">
              <p class="text-label q-mb-sm">First Name</p>
              <input class="input-glass" type="text" placeholder="e.g. Juan"/>
            </div>
            <div class="col">
              <p class="text-label q-mb-sm">Last Name</p>
              <input class="input-glass" type="text" placeholder="e.g. Dela Cruz"/>
            </div>
          </div>
          <div class="row q-gutter-md q-mb-md">
            <div class="col">
              <p class="text-label q-mb-sm">Email</p>
              <input class="input-glass" type="email" placeholder="student@school.edu"/>
            </div>
            <div class="col">
              <p class="text-label q-mb-sm">Section</p>
              <select class="input-glass" style="appearance: none; cursor: pointer">
                <option>Grade 12 - Java</option>
                <option>Grade 11 - Hardware</option>
                <option>Grade 11 - Code</option>
              </select>
            </div>
          </div>
          <p class="text-label q-mb-sm q-mt-md">Quasar Q-Input</p>
          <div class="row q-gutter-md">
            <div class="col">
              <q-input outlined label="Score (out of 20)" type="number" placeholder="0"/>
            </div>
            <div class="col">
              <q-select outlined label="Grading Period" :options="['Prelim','Midterm','Semi-Finals','Finals']"/>
            </div>
          </div>
        </div>
      </ComponentSection>

      <!-- ── 7. Alerts ──────────────────────────────── -->
      <ComponentSection title="Alerts & Notifications" icon="notifications">
        <div class="column q-gutter-md">
          <div class="alert alert--info">
            <q-icon name="info" size="20px" style="color: var(--sms-blue); flex-shrink: 0; margin-top:1px"/>
            <div>
              <p style="font-weight:600; margin:0 0 3px; color: var(--sms-blue)">Semester 2 starts on July 7.</p>
              <p style="margin:0; color: var(--text-secondary)">Make sure all grade submissions are finalized before the deadline.</p>
            </div>
          </div>
          <div class="alert alert--danger">
            <q-icon name="warning" size="20px" style="color: var(--sms-red); flex-shrink: 0; margin-top:1px"/>
            <div>
              <p style="font-weight:600; margin:0 0 3px; color: var(--sms-red)">You have 3 unfinished tasks!</p>
              <p style="margin:0; color: var(--text-secondary)">Complete them before the grading period closes.</p>
            </div>
          </div>
          <div class="alert alert--success">
            <q-icon name="check_circle" size="20px" style="color: var(--color-success); flex-shrink: 0; margin-top:1px"/>
            <div>
              <p style="font-weight:600; margin:0 0 3px; color: var(--color-success)">Activity 2 submitted successfully!</p>
              <p style="margin:0; color: var(--text-secondary)">Teacher will grade it within 3 days.</p>
            </div>
          </div>
          <div class="alert alert--warning">
            <q-icon name="schedule" size="20px" style="color: var(--color-warning); flex-shrink: 0; margin-top:1px"/>
            <div>
              <p style="font-weight:600; margin:0 0 3px; color: var(--color-warning)">Activity 5 is due in 24 hours.</p>
              <p style="margin:0; color: var(--text-secondary)">You have not started this yet. Don't miss the deadline.</p>
            </div>
          </div>
        </div>
      </ComponentSection>

      <!-- ── 8. Progress Bars ───────────────────────── -->
      <ComponentSection title="Progress Bars" icon="bar_chart">
        <div class="glass-card q-pa-lg column q-gutter-md">
          <div v-for="item in progressItems" :key="item.label">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-caption">{{ item.label }}</span>
              <span style="font-size:13px; font-weight:700; color: var(--text-primary)">{{ item.value }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: item.value + '%', background: item.color }"></div>
            </div>
          </div>
        </div>
      </ComponentSection>

      <!-- ── 9. Tables ──────────────────────────────── -->
      <ComponentSection title="Grade Table" icon="table_chart">
        <div class="glass-card" style="overflow: hidden;">
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-color);">
                  <th v-for="h in tableHeaders" :key="h" style="padding: 14px 20px; text-align: left;" class="text-label">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in tableRows" :key="i"
                  style="border-bottom: 1px solid var(--border-color); transition: background var(--transition-base);"
                  class="table-row-hover"
                >
                  <td style="padding: 14px 20px;" class="text-body">{{ row.student }}</td>
                  <td style="padding: 14px 20px;">
                    <span :class="['badge', row.present >= 90 ? 'badge-green' : row.present >= 75 ? 'badge-orange' : 'badge-red']">
                      {{ row.present }}%
                    </span>
                  </td>
                  <td style="padding: 14px 20px;" class="text-body">{{ row.written }}</td>
                  <td style="padding: 14px 20px;" class="text-body">{{ row.pt }}</td>
                  <td style="padding: 14px 20px;" class="text-body">{{ row.exam }}</td>
                  <td style="padding: 14px 20px;">
                    <span style="font-size:15px; font-weight:700;" :style="{ color: row.final >= 75 ? 'var(--color-success)' : 'var(--sms-red)' }">
                      {{ row.final }}
                    </span>
                  </td>
                  <td style="padding: 14px 20px;">
                    <q-icon name="check_box" v-if="row.submitted" size="20px" style="color: var(--color-success)"/>
                    <q-icon name="check_box_outline_blank" v-else size="20px" style="color: var(--text-muted)"/>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ComponentSection>

      <!-- ── 10. Skeleton Loaders ───────────────────── -->
      <ComponentSection title="Skeleton Loaders" icon="hourglass_empty">
        <div class="row q-gutter-md">
          <!-- Card Skeleton -->
          <div class="col glass-card q-pa-lg">
            <p class="text-label q-mb-md">Card Skeleton</p>
            <div class="skeleton skeleton-thumb q-mb-md"></div>
            <div class="row items-center q-gutter-md q-mb-md">
              <div class="skeleton skeleton-avatar"></div>
              <div style="flex: 1;">
                <div class="skeleton skeleton-text" style="width:80%"></div>
                <div class="skeleton skeleton-text" style="width:50%"></div>
              </div>
            </div>
            <div class="skeleton skeleton-text" style="width:100%"></div>
            <div class="skeleton skeleton-text" style="width:90%"></div>
            <div class="skeleton skeleton-text" style="width:70%"></div>
          </div>
          <!-- Grade Row Skeleton -->
          <div class="col glass-card q-pa-lg">
            <p class="text-label q-mb-md">Grade List Skeleton</p>
            <div v-for="n in 4" :key="n" class="row items-center q-gutter-md q-mb-md">
              <div class="skeleton skeleton-avatar" style="width:36px; height:36px;"></div>
              <div style="flex:1">
                <div class="skeleton skeleton-text" :style="{width: (60 + n*8) + '%'}"></div>
                <div class="skeleton skeleton-text" style="width:40%; height:12px"></div>
              </div>
              <div class="skeleton skeleton-btn" style="width: 60px; height:28px;"></div>
            </div>
          </div>
          <!-- Stat Card Skeleton -->
          <div class="col glass-card q-pa-lg">
            <p class="text-label q-mb-md">Stat Skeleton</p>
            <div v-for="n in 3" :key="n" class="glass-card stat-card q-mb-sm" style="border-radius: var(--radius-md);">
              <div class="skeleton" style="width:52px; height:52px; border-radius:16px; flex-shrink:0;"></div>
              <div style="flex:1">
                <div class="skeleton skeleton-text" style="width:60%; height: 12px; margin-bottom:8px;"></div>
                <div class="skeleton skeleton-title" style="width:40%; height: 24px; margin-bottom:0;"></div>
              </div>
            </div>
          </div>
        </div>
      </ComponentSection>

      <!-- ── 11. Attendance ─────────────────────────── -->
      <ComponentSection title="Attendance Widget" icon="how_to_reg">
        <div class="row q-gutter-md">
          <div class="col glass-card q-pa-lg">
            <div class="row items-center justify-between q-mb-md">
              <p class="text-subtitle q-mb-0">June 2026 Attendance</p>
              <span class="badge badge-blue">Section A</span>
            </div>
            <div class="row q-gutter-sm">
              <div
                v-for="day in attendanceDays"
                :key="day.d"
                :title="day.status"
                style="width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; cursor: pointer;"
                :style="{
                  background: day.status === 'Present' ? 'rgba(52,199,89,0.15)' :
                              day.status === 'Absent'  ? 'rgba(255,59,48,0.15)' :
                              day.status === 'Late'    ? 'rgba(255,149,0,0.15)' :
                              day.status === 'Excused' ? 'rgba(90,200,250,0.15)' :
                              'var(--skeleton-base)',
                  color: day.status === 'Present' ? 'var(--color-success)' :
                         day.status === 'Absent'  ? 'var(--sms-red)' :
                         day.status === 'Late'    ? 'var(--color-warning)' :
                         day.status === 'Excused' ? 'var(--sms-blue-light)' :
                         'var(--text-muted)'
                }"
              >{{ day.d }}</div>
            </div>
            <div class="row q-gutter-sm q-mt-md">
              <span class="badge badge-green">✓ Present: 18</span>
              <span class="badge badge-red">✗ Absent: 2</span>
              <span class="badge badge-orange">⚠ Late: 1</span>
            </div>
          </div>
        </div>
      </ComponentSection>

      <!-- ── 12. Notification Toast ─────────────────── -->
      <ComponentSection title="Push Notification Preview" icon="notifications_active">
        <div class="row q-gutter-md">
          <div class="col-auto glass-card q-pa-lg" style="max-width: 380px; position: relative; overflow: visible;">
            <div class="row items-center q-gutter-sm q-mb-sm">
              <div style="width:36px; height:36px; border-radius:10px; background: linear-gradient(135deg, var(--sms-blue), var(--sms-blue-light)); display:flex; align-items:center; justify-content:center;">
                <q-icon name="grade" size="18px" style="color:#fff"/>
              </div>
              <div>
                <p style="font-size:12px; font-weight:700; margin:0; color: var(--text-primary)">SMS School System</p>
                <p style="font-size:11px; color:var(--text-muted); margin:0">now</p>
              </div>
            </div>
            <p style="font-size:14px; font-weight:600; margin:0 0 3px; color: var(--text-primary)">New Grade Posted 🎉</p>
            <p style="font-size:13px; color: var(--text-secondary); margin:0">Activity 3 — SQL Joins has been marked. Your score: <strong style="color: var(--sms-blue)">18/20.</strong></p>
          </div>
          <div class="col-auto glass-card q-pa-lg" style="max-width: 380px; border-left: 3px solid var(--color-warning);">
            <div class="row items-center q-gutter-sm q-mb-sm">
              <div style="width:36px; height:36px; border-radius:10px; background: rgba(255,149,0,0.15); display:flex; align-items:center; justify-content:center;">
                <q-icon name="schedule" size="18px" style="color: var(--color-warning);"/>
              </div>
              <div>
                <p style="font-size:12px; font-weight:700; margin:0; color: var(--text-primary)">Task Reminder</p>
                <p style="font-size:11px; color:var(--text-muted); margin:0">2 hours ago</p>
              </div>
            </div>
            <p style="font-size:14px; font-weight:600; margin:0 0 3px; color: var(--text-primary)">Activity 4 due tomorrow!</p>
            <p style="font-size:13px; color: var(--text-secondary); margin:0">HTML/CSS Layout Task is still unsubmitted.</p>
          </div>
        </div>
      </ComponentSection>

      <!-- Footer Spacer -->
      <div style="height: 80px;"></div>
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import ComponentSection from '@/components/ui/ComponentSection.vue'
import ColorSwatch from '@/components/ui/ColorSwatch.vue'

const $q = useQuasar()

const progressItems = [
  { label: 'Written Works (15%)',      value: 82, color: 'linear-gradient(135deg, #007AFF, #5AC8FA)' },
  { label: 'Performance Tasks (65%)',  value: 76, color: 'linear-gradient(135deg, #FF3B30, #FF6961)' },
  { label: 'Exam (20%)',               value: 90, color: 'linear-gradient(135deg, #34C759, #30D158)' },
  { label: 'Attendance',               value: 95, color: 'linear-gradient(135deg, #FF9500, #FFCC00)' },
]

const tableHeaders = ['Student', 'Attendance', 'Written', 'Perf. Task', 'Exam', 'Final', 'Physical']
const tableRows = [
  { student: 'Juan Dela Cruz',    present: 95, written: 85, pt: 90, exam: 88, final: 89.3, submitted: true },
  { student: 'Maria Santos',      present: 78, written: 72, pt: 68, exam: 70, final: 69.8, submitted: false },
  { student: 'Pedro Garcia',      present: 100, written: 95, pt: 98, exam: 92, final: 96.2, submitted: true },
  { student: 'Ana Reyes',         present: 60,  written: 65, pt: 60, exam: 58, final: 61.0, submitted: false },
  { student: 'Jose Bernardo',     present: 88,  written: 80, pt: 84, exam: 82, final: 82.9, submitted: true },
]

const attendanceDays = [
  ...Array.from({ length: 21 }, (_, i) => ({
    d: i + 1,
    status: i < 18
      ? (['Present','Present','Present','Present','Present','Present','Late','Present','Absent','Present','Present','Present','Present','Present','Present','Present','Absent','Present'][i])
      : 'Future'
  }))
]
</script>

<style scoped>
.table-row-hover:hover {
  background: rgba(0, 122, 255, 0.04);
}
</style>
