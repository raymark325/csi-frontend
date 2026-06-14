<template>
  <q-form @submit.prevent="handleSubmit" class="q-gutter-md text-white">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-input
          v-model="form.title"
          label="Assignment Title"
          label-color="grey-4"
          input-style="color: white;"
          filled
          dark
          :rules="[val => !!val || 'Title is required']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          v-model="form.grading_category_id"
          :options="categories"
          option-value="id"
          option-label="name"
          emit-value
          map-options
          label="Grading Category"
          label-color="grey-4"
          filled
          dark
          :rules="[val => !!val || 'Category is required']"
        />
      </div>
      <div class="col-12">
        <q-input
          v-model="form.description"
          type="textarea"
          label="Instructions / Description"
          label-color="grey-4"
          input-style="color: white;"
          filled
          dark
          rows="4"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="form.type"
          :options="assignmentTypes"
          label="Type"
          label-color="grey-4"
          filled
          dark
          :rules="[val => !!val || 'Type is required']"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model.number="form.max_score"
          type="number"
          label="Maximum Score"
          label-color="grey-4"
          input-style="color: white;"
          filled
          dark
          :rules="[val => val > 0 || 'Max score must be greater than 0']"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model="form.due_date"
          type="datetime-local"
          label="Due Date"
          label-color="grey-4"
          input-style="color: white;"
          filled
          dark
          stack-label
          :rules="[val => !!val || 'Due date is required']"
        />
      </div>
    </div>

    <div class="row justify-end q-mt-md">
      <q-btn label="Cancel" color="grey-7" flat class="q-mr-sm" @click="$emit('cancel')" />
      <q-btn type="submit" :label="isEdit ? 'Save Changes' : 'Create Assignment'" color="primary" class="glow-btn" />
    </div>
  </q-form>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  categories: {
    type: Array,
    required: true
  },
  isEdit: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['submit', 'cancel']);

const assignmentTypes = ['written', 'code_java', 'code_sql', 'code_html'];

const form = ref({
  title: '',
  description: '',
  type: 'written',
  max_score: 100,
  due_date: '',
  grading_category_id: null,
  ...props.initialData
});

watch(() => props.initialData, (newVal) => {
  form.value = { ...form.value, ...newVal };
}, { deep: true });

const handleSubmit = () => {
  emit('submit', { ...form.value });
};
</script>

<style scoped>
.glow-btn {
  background: #007AFF !important;
  color: white;
  box-shadow: 0 4px 14px rgba(0, 122, 255, 0.4);
  font-weight: bold;
}
.glow-btn:hover {
  box-shadow: 0 6px 20px rgba(0, 122, 255, 0.6);
}
</style>
