<template>
  <div class="weighting-panel q-pa-md glass-card text-white">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h6 text-azure">Category Weighting Configuration</div>
      <q-chip :color="totalWeight === 100 ? 'green' : 'red'" text-color="white">
        Total Weight: {{ totalWeight }}%
      </q-chip>
    </div>

    <q-list dark separator>
      <q-item v-for="category in categories" :key="category.id">
        <q-item-section>
          <q-item-label class="text-weight-bold">{{ category.name }}</q-item-label>
          <q-item-label caption class="text-grey-4">Category Type: {{ category.type || 'N/A' }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="row items-center no-wrap">
            <q-input
              :model-value="category.weight"
              type="number"
              suffix="%"
              dense
              dark
              outlined
              input-style="color: white; width: 60px; text-align: center;"
              @update:model-value="(val) => handleWeightUpdate(category.id, val)"
            />
            <q-btn
              flat
              round
              dense
              color="negative"
              icon="delete"
              class="q-ml-sm"
              @click="$emit('delete-category', category.id)"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <div v-if="totalWeight !== 100" class="text-caption text-red q-mt-md">
      * Warning: Weights must sum up to exactly 100% to calculate grades properly.
    </div>

    <div class="row justify-end q-mt-md">
      <q-btn label="Add New Category" color="primary" icon="add" @click="$emit('add-category')" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  categories: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['weight-change', 'add-category', 'delete-category']);

const totalWeight = computed(() => {
  return props.categories.reduce((sum, cat) => sum + parseFloat(cat.weight || 0), 0);
});

const handleWeightUpdate = (id, newWeight) => {
  emit('weight-change', { id, weight: parseFloat(newWeight) });
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

.text-azure {
  color: #007AFF;
}
</style>
