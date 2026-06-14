<template>
  <div class="grade-table-wrapper q-pa-md glass-card text-white">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h6 text-azure">Student Grades Matrix</div>
      <q-btn flat dense icon="refresh" color="grey-4" @click="$emit('refresh')" />
    </div>

    <q-markup-table flat dark class="glass-table">
      <thead>
        <tr>
          <th class="text-left">Student Name</th>
          <th v-for="category in categories" :key="category.id" class="text-center">
            {{ category.name }} ({{ category.weight }}%)
          </th>
          <th class="text-center font-weight-bold text-azure">Final Grade</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in gradebook" :key="row.enrollment_id">
          <td class="text-left text-weight-bold">{{ row.name }}</td>
          <td v-for="category in categories" :key="category.id" class="text-center">
            <q-input
              :model-value="row.scores[category.id]"
              type="number"
              dense
              dark
              borderless
              input-class="text-center cursor-pointer edit-score-input"
              @update:model-value="(val) => handleScoreChange(row.enrollment_id, category.id, val)"
              :rules="[val => val >= 0 && val <= 100 || 'Invalid score']"
              hide-bottom-space
            />
          </td>
          <td class="text-center text-weight-bold text-azure">{{ row.final_grade }}%</td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script setup>
const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  gradebook: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['score-change', 'refresh']);

const handleScoreChange = (enrollmentId, categoryId, newScore) => {
  if (newScore !== '' && newScore !== null && newScore !== undefined) {
    emit('score-change', {
      enrollment_id: enrollmentId,
      grading_category_id: categoryId,
      raw_score: parseFloat(newScore),
      max_score: 100
    });
  }
};
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
}

.glass-table {
  background: transparent !important;
}

.edit-score-input {
  color: white;
  transition: all 0.3s ease;
}

.edit-score-input:focus {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(0, 122, 255, 0.5);
}

.text-azure {
  color: #007AFF;
}
</style>
