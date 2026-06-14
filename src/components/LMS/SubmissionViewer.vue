<template>
  <q-card class="submission-viewer glass-card text-white">
    <q-card-section>
      <div class="row items-center justify-between">
        <div class="text-h6 text-azure">Submission Details</div>
        <q-chip :color="getStatusColor(submission.status)" text-color="white">
          {{ submission.status.toUpperCase() }}
        </q-chip>
      </div>
      <div class="text-subtitle2 text-grey-4 q-mt-xs">
        Submitted by Student ID: {{ submission.student_id }}
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div class="text-subtitle1 text-weight-bold q-mb-xs">Content/Code:</div>
      <pre class="code-preview q-pa-md">{{ submission.content || 'No text or code submitted.' }}</pre>

      <div v-if="submission.file_path" class="q-mt-md">
        <div class="text-subtitle2 text-grey-4">Attachment:</div>
        <q-btn
          outline
          color="primary"
          icon="download"
          :label="submission.file_path.split('/').pop()"
          @click="downloadFile(submission.file_path)"
        />
      </div>

      <div v-if="submission.feedback" class="q-mt-md feedback-section q-pa-sm rounded-borders">
        <div class="text-subtitle2 text-accent">Teacher's Feedback:</div>
        <div class="text-body2 text-grey-3">{{ submission.feedback }}</div>
      </div>
    </q-card-section>

    <q-separator dark />

    <q-card-actions align="right" class="q-pa-md">
      <div v-if="submission.score !== null && submission.score !== undefined" class="text-h6 text-green q-mr-md">
        Score: {{ submission.score }} / {{ submission.assignment?.max_score || 100 }}
      </div>
      <slot name="actions"></slot>
    </q-card-actions>
  </q-card>
</template>

<script setup>
defineProps({
  submission: {
    type: Object,
    required: true
  }
});

const getStatusColor = (status) => {
  switch (status) {
    case 'graded': return 'green';
    case 'submitted': return 'blue';
    default: return 'orange';
  }
};

const downloadFile = (path) => {
  window.open(path, '_blank');
};
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
}

.code-preview {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
  white-space: pre-wrap;
  color: #a9ffb2;
}

.feedback-section {
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.2);
}

.text-azure {
  color: #007AFF;
}

.text-accent {
  color: #FF3B30;
}
</style>
