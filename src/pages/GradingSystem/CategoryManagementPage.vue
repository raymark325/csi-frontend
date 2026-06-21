<template>
  <div class="q-pa-lg">
    <!-- Header -->
    <div class="row justify-between items-center q-mb-xl">
      <div>
        <p class="text-label q-mb-xs" style="color: var(--sms-blue);">GRADING CONFIGURATION</p>
        <h1 class="text-display q-my-none">Category Weights</h1>
        <p class="text-body q-my-none" style="color: var(--text-secondary);">Define categories (e.g. Quizzes, Projects, Exams) and weights (%).</p>
      </div>
    </div>

    <!-- Section Selection -->
    <div class="row q-col-gutter-md q-mb-xl items-center">
      <div class="col-12 col-sm-4">
        <p class="text-label q-mb-xs">Select Subject</p>
        <select v-model="selectedSectionId" class="input-glass" @change="loadCategories">
          <option v-for="sec in sections" :key="sec.id" :value="sec.id">
            {{ sec.course?.title }} - {{ sec.section?.name || sec.name }}
          </option>
        </select>
      </div>
      <div class="col q-mt-md">
        <q-btn
          color="primary"
          icon="add"
          label="Add Category"
          rounded
          unelevated
          @click="openAddDialog"
          :disabled="weightSum >= 100"
        />
      </div>
    </div>

    <!-- Weight Sum Indicator -->
    <div class="glass-card q-pa-lg q-mb-xl">
      <div class="row justify-between items-center">
        <div>
          <p class="text-subtitle q-my-none" style="font-weight: 700;">Weight Allocation Status</p>
          <p class="text-caption q-my-none" style="margin-top: 2px;">
            Total weight must equal 100%. Current allocation: <strong>{{ weightSum }}%</strong>
          </p>
        </div>
        <span
          class="badge"
          :class="weightSum === 100 ? 'badge-green' : 'badge-orange'"
        >
          {{ weightSum === 100 ? 'Valid Schema' : 'Action Required' }}
        </span>
      </div>
      <div class="progress-track q-mt-md">
        <div
          class="progress-fill"
          :style="{
            width: weightSum + '%',
            background: weightSum === 100 ? 'var(--color-success)' : 'var(--color-warning)'
          }"
        ></div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="gradeStore.isLoading" class="row justify-center q-py-xl">
      <q-spinner-dots size="40px" color="primary" />
    </div>

    <!-- Category List Grid -->
    <div v-else class="row q-col-gutter-md">
      <div v-for="cat in gradeStore.categories" :key="cat.id" class="col-12 col-md-4">
        <div class="glass-card q-pa-lg">
          <div class="row justify-between items-start q-mb-md">
            <div>
              <h3 class="q-my-none" style="font-size: 18px; font-weight: 700; color: var(--text-primary);">
                {{ cat.name }}
              </h3>
            </div>
            <span class="badge badge-blue" style="font-size: 14px; font-weight: 700;">
              {{ cat.weight }}%
            </span>
          </div>

          <div class="row q-gutter-xs justify-end">
            <q-btn
              outline
              color="primary"
              label="Edit"
              size="sm"
              rounded
              @click="openEditDialog(cat)"
            />
            <q-btn
              outline
              color="negative"
              label="Delete"
              size="sm"
              rounded
              @click="handleDelete(cat.id)"
            />
          </div>
        </div>
      </div>

      <div v-if="!gradeStore.categories.length" class="col-12 text-center text-muted q-py-xl glass-card">
        No grading categories defined yet. Add some to configure grades calculation.
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="glass-q-card" style="width: 400px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6 text-primary font-weight-bold">
            {{ isEditing ? 'Edit Category' : 'Add Grading Category' }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Category Name</p>
            <input v-model="formData.name" class="input-glass" type="text" placeholder="e.g. Performance Tasks"/>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Weight Allocation (%)</p>
            <input v-model.number="formData.weight" class="input-glass" type="number" min="0" :max="100 - weightSum + (isEditing ? editingCategoryWeight : 0)"/>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pb-md q-pr-md">
          <q-btn label="Cancel" flat rounded v-close-popup />
          <q-btn label="Save" color="primary" rounded unelevated @click="handleSave" :loading="isSubmitting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useGradeStore } from '../../stores/GradingSystem/gradeStore';
import { useDashboardStore } from '../../stores/dashboardStore';

const gradeStore = useGradeStore();
const dashboardStore = useDashboardStore();

const selectedSectionId = ref(null);
const sections = ref([]);
const showDialog = ref(false);
const isEditing = ref(false);
const isSubmitting = ref(false);
const editingCategoryId = ref(null);
const editingCategoryWeight = ref(0);

const formData = ref({
  section_id: '',
  name: '',
  weight: 10,
});

const weightSum = computed(() => {
  return gradeStore.categories.reduce((acc, cat) => acc + cat.weight, 0);
});

const loadCategories = () => {
  if (!selectedSectionId.value) return;
  gradeStore.fetchCategories(selectedSectionId.value);
};

const openAddDialog = () => {
  isEditing.value = false;
  formData.value = {
    section_id: selectedSectionId.value,
    name: '',
    weight: Math.min(10, 100 - weightSum.value),
  };
  showDialog.value = true;
};

const openEditDialog = (cat) => {
  isEditing.value = true;
  editingCategoryId.value = cat.id;
  editingCategoryWeight.value = cat.weight;
  formData.value = {
    section_id: selectedSectionId.value,
    name: cat.name,
    weight: cat.weight,
  };
  showDialog.value = true;
};

const handleSave = async () => {
  if (!formData.value.name || formData.value.weight <= 0) return;
  isSubmitting.value = true;
  try {
    if (isEditing.value) {
      await gradeStore.updateCategory(editingCategoryId.value, formData.value);
    } else {
      await gradeStore.createCategory(formData.value);
    }
    showDialog.value = false;
    loadCategories();
  } catch (err) {
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id) => {
  if (!confirm('Are you sure you want to delete this category? All related grades will be affected.')) return;
  try {
    await gradeStore.deleteCategory(id);
    loadCategories();
  } catch (err) {
    console.error(err);
  }
};

onMounted(async () => {
  try {
    await dashboardStore.fetchSections();
    sections.value = dashboardStore.sections;
    if (sections.value.length > 0) {
      selectedSectionId.value = sections.value[0].id;
      loadCategories();
    }
  } catch (err) {
    console.error(err);
  }
});
</script>
