<template>
  <div class="row justify-center items-center bg-gradient-mesh" style="min-height: 100vh; padding: 24px;">
    <div class="col-12 col-sm-10 col-md-8 col-lg-6">
      <div class="glass-card q-pa-xl">
        <!-- Logo Header -->
        <div class="column items-center q-mb-xl">
          <div class="logo-box q-mb-md">
            <q-icon name="person_add" size="32px" style="color: #fff;"/>
          </div>
          <h2 class="text-title text-center q-mt-none q-mb-xs" style="font-size: 26px; font-weight: 800;">
            Create an <span class="text-gradient-blue">Account</span>
          </h2>
          <p class="text-caption text-center" style="font-size:14px; margin:0;">
            Join us as a Student to access your modules, grades & labs.
          </p>
        </div>

        <!-- Notification Alerts -->
        <div v-if="errorMsg" class="alert alert--danger q-mb-lg">
          <q-icon name="warning" size="20px" style="color: var(--sms-red); flex-shrink: 0; margin-top:1px"/>
          <div>
            <p style="font-weight:600; margin:0; color: var(--sms-red)">{{ errorMsg }}</p>
          </div>
        </div>

        <div v-if="successMsg" class="alert alert--success q-mb-lg" style="background: rgba(46, 213, 115, 0.1); border: 1px solid rgba(46, 213, 115, 0.3); border-radius: 12px; padding: 16px; display: flex; gap: 12px; align-items: flex-start;">
          <q-icon name="check_circle" size="20px" style="color: var(--sms-green); flex-shrink: 0; margin-top:1px"/>
          <div>
            <p style="font-weight:600; margin:0; color: var(--sms-green)">{{ successMsg }}</p>
          </div>
        </div>

        <!-- Form Fields -->
        <form @submit.prevent="handleRegister">
          
          <div class="text-subtitle2 q-mb-sm text-left" style="font-weight: 700; color: var(--sms-blue);">Personal Details</div>
          
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-5">
              <p class="text-label q-mb-xs">First Name <span class="text-negative">*</span></p>
              <input v-model="formData.firstName" class="input-glass" type="text" placeholder="John" required />
            </div>
            <div class="col-12 col-sm-3">
              <p class="text-label q-mb-xs">M.I.</p>
              <input v-model="formData.middleName" class="input-glass" type="text" placeholder="D" />
            </div>
            <div class="col-12 col-sm-4">
              <p class="text-label q-mb-xs">Last Name <span class="text-negative">*</span></p>
              <input v-model="formData.lastName" class="input-glass" type="text" placeholder="Doe" required />
            </div>
          </div>

          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-sm-3">
              <p class="text-label q-mb-xs">Suffix</p>
              <input v-model="formData.suffix" class="input-glass" type="text" placeholder="Jr" />
            </div>
            <div class="col-12 col-sm-3">
              <p class="text-label q-mb-xs">Age</p>
              <input v-model="formData.age" class="input-glass" type="number" placeholder="18" />
            </div>
            <div class="col-12 col-sm-6">
              <p class="text-label q-mb-xs">Contact Number</p>
              <input v-model="formData.contactNumber" class="input-glass" type="text" placeholder="09123456789" />
            </div>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Home Address</p>
            <textarea v-model="formData.address" class="input-glass" rows="2" placeholder="123 Main St..."></textarea>
          </div>

          <div class="q-mb-lg">
            <p class="text-label q-mb-xs">Section</p>
            <select v-model="formData.section_id" class="input-glass" :disabled="isLoadingSections">
              <option value="" disabled selected>Select a section</option>
              <option v-for="section in sections" :key="section.id" :value="section.id">
                {{ section.name }}
              </option>
            </select>
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Verification Photo (Required) <span class="text-negative">*</span></p>
            <div class="row q-gutter-sm items-center">
              <input type="file" ref="fileInput" @change="handleProfilePic" accept="image/*" style="display: none;" />
              <q-btn outline color="primary" icon="upload_file" label="Upload Image" @click="$refs.fileInput.click()" class="col" />
              <q-btn icon="camera_alt" color="primary" rounded outline label="Take Photo" @click="startCamera" />
            </div>

            <!-- Camera View -->
            <div v-if="cameraActive" class="q-mt-sm glass-card q-pa-sm text-center">
              <video ref="videoElement" autoplay playsinline style="width: 100%; max-height: 250px; border-radius: 8px; background: #000; object-fit: cover;"></video>
              <div class="row q-gutter-sm q-mt-sm justify-center">
                <q-btn color="primary" icon="camera" label="Capture" @click="capturePhoto" rounded unelevated />
                <q-btn color="negative" flat label="Cancel" @click="stopCamera" rounded />
              </div>
            </div>

            <!-- Preview -->
            <div v-if="photoPreview && !cameraActive" class="q-mt-sm row items-center q-gutter-md glass-card q-pa-sm">
              <img :src="photoPreview" style="width: 60px; height: 60px; object-fit: cover; border-radius: 50%; border: 2px solid var(--sms-blue);" />
              <div>
                <p class="text-body2 q-my-none text-weight-bold" style="color: var(--text-primary);">Photo ready</p>
                <q-btn flat color="negative" label="Remove" size="sm" class="q-px-none" @click="removePhoto" />
              </div>
            </div>
          </div>

          <hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.05); margin: 24px 0;" />
          <div class="text-subtitle2 q-mb-sm text-left" style="font-weight: 700; color: var(--sms-blue);">Account Credentials</div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Email Address <span class="text-negative">*</span></p>
            <input v-model="formData.email" class="input-glass" type="email" placeholder="john@sms.edu" required />
          </div>

          <div class="row q-col-gutter-md q-mb-xl">
            <div class="col-12 col-sm-6">
              <p class="text-label q-mb-xs">Password <span class="text-negative">*</span></p>
              <input v-model="formData.password" class="input-glass" type="password" placeholder="••••••••" required minlength="6" />
            </div>
            <div class="col-12 col-sm-6">
              <p class="text-label q-mb-xs">Confirm Password <span class="text-negative">*</span></p>
              <input v-model="formData.confirmPassword" class="input-glass" type="password" placeholder="••••••••" required minlength="6" />
            </div>
          </div>

          <!-- Submit Button -->
          <button class="btn-primary full-width justify-center q-mb-lg" type="submit" :disabled="isLoading">
            <span v-if="isLoading">Registering...</span>
            <span v-else>Register as Student</span>
          </button>

          <div class="text-center">
            <p class="text-caption" style="margin: 0; color: var(--text-secondary);">
              Already have an account? 
              <router-link to="/login" style="color: var(--sms-blue); font-weight: 600; text-decoration: none;">
                Sign in here
              </router-link>
            </p>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import api from '../../services/api';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref({
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  age: '',
  contactNumber: '',
  address: '',
  email: '',
  password: '',
  confirmPassword: '',
  section_id: ''
});

const sections = ref([]);
const isLoadingSections = ref(false);

onMounted(async () => {
  isLoadingSections.value = true;
  try {
    const response = await api.get('/public/sections');
    if (response.success) {
      sections.value = response.data;
    }
  } catch (error) {
    console.error('Failed to load sections', error);
  } finally {
    isLoadingSections.value = false;
  }
});

const isLoading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');
let selectedProfilePic = null;
const photoPreview = ref(null);
const cameraActive = ref(false);
const videoElement = ref(null);
let mediaStream = null;

const startCamera = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraActive.value = true;
    setTimeout(() => {
      if (videoElement.value) {
        videoElement.value.srcObject = mediaStream;
      }
    }, 100);
  } catch (err) {
    alert('Could not access camera: ' + err.message);
  }
};

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  cameraActive.value = false;
};

const capturePhoto = () => {
  if (!videoElement.value) return;
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.value.videoWidth || 640;
  canvas.height = videoElement.value.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height);
  
  photoPreview.value = canvas.toDataURL('image/jpeg');
  
  canvas.toBlob((blob) => {
    if (blob) {
      const file = new File([blob], "profile_photo.jpg", { type: "image/jpeg" });
      selectedProfilePic = file;
    }
    stopCamera();
  }, 'image/jpeg', 0.9);
};

const removePhoto = () => {
  photoPreview.value = null;
  selectedProfilePic = null;
};

const fileInput = ref(null);

const handleProfilePic = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedProfilePic = file;
    photoPreview.value = URL.createObjectURL(file);
    stopCamera();
  } else {
    removePhoto();
  }
};

const handleRegister = async () => {
  errorMsg.value = '';
  successMsg.value = '';

  if (formData.value.password !== formData.value.confirmPassword) {
    errorMsg.value = 'Passwords do not match.';
    return;
  }

  if (!selectedProfilePic) {
    errorMsg.value = 'A verification photo is required. Please upload an image or take a photo.';
    return;
  }

  isLoading.value = true;
  try {
    const payload = {
      first_name: formData.value.firstName,
      middle_name: formData.value.middleName,
      last_name: formData.value.lastName,
      suffix: formData.value.suffix,
      age: formData.value.age ? parseInt(formData.value.age) : null,
      contact_number: formData.value.contactNumber,
      address: formData.value.address,
      section_id: formData.value.section_id || null,
      email: formData.value.email,
      password: formData.value.password,
    };
    
    if (selectedProfilePic) {
      payload.profile_picture = selectedProfilePic;
    }

    await authStore.register(payload);

    successMsg.value = 'Registration successful! Please wait for admin approval.';
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (error) {
    errorMsg.value = error.response?.data?.message || 'Registration failed. Email might already exist.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.logo-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--sms-blue), var(--sms-blue-light));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 122, 255, 0.3);
}

.full-width {
  width: 100%;
}

textarea.input-glass {
  resize: vertical;
  min-height: 80px;
}
</style>
