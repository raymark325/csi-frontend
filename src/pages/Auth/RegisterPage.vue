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

          <!-- Data Privacy & Terms Checkbox -->
          <div class="privacy-box q-mb-lg">
            <label class="row items-start q-gutter-sm cursor-pointer">
              <input
                type="checkbox"
                v-model="agreedToTerms"
                class="q-mt-xs"
                style="width:17px; height:17px; flex-shrink:0; accent-color: var(--sms-blue);"
              />
              <span style="font-size:13px; line-height:1.5; color: var(--text-secondary);">
                I have read and agree to the
                <a href="#" @click.prevent="showTermsModal = true" style="color: var(--sms-blue); font-weight:600; text-decoration:underline;">Data Privacy Policy</a>
                and
                <a href="#" @click.prevent="showTermsModal = true" style="color: var(--sms-blue); font-weight:600; text-decoration:underline;">Terms &amp; Conditions</a>
                of this Learning Management System.
              </span>
            </label>
          </div>

          <!-- Submit Button -->
          <button class="btn-primary full-width justify-center q-mb-lg" type="submit" :disabled="isLoading || !agreedToTerms">
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

  <!-- OTP Modal -->
  <q-dialog v-model="showOtpModal" persistent>
    <q-card style="min-width: 350px; border-radius: 16px;" class="q-pa-md text-center">
      <q-card-section>
        <div class="text-h6 text-weight-bold" style="color: var(--sms-blue);">Email Verification</div>
        <p class="text-caption q-mt-sm" style="color: var(--text-secondary);">
          We have sent a 6-digit One Time Password (OTP) to <strong>{{ formData.email }}</strong>. Please enter it below to complete your registration.
        </p>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input 
          v-model="otpCode" 
          outlined 
          dense 
          mask="######" 
          placeholder="Enter 6-digit OTP" 
          autofocus 
          @keyup.enter="completeRegistration"
          :error="!!otpError"
          :error-message="otpError"
        />
      </q-card-section>

      <q-card-actions align="center" class="q-pb-md">
        <q-btn flat label="Cancel" color="negative" v-close-popup :disable="isLoading" />
        <q-btn unelevated rounded color="primary" label="Verify & Register" @click="completeRegistration" :loading="isLoading" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Data Privacy & Terms Modal -->
  <q-dialog v-model="showTermsModal" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="column" style="max-width: 760px; margin: auto; border-radius: 20px;">
      <q-card-section class="row items-center justify-between q-pb-none" style="background: var(--sms-blue); color: white;">
        <div class="text-h6 text-white"><q-icon name="gavel" class="q-mr-sm" />Data Privacy &amp; Terms of Use</div>
        <q-btn icon="close" flat round dense color="white" v-close-popup />
      </q-card-section>

      <q-card-section class="col scroll q-pa-xl" style="background: #f8fafc;">
        <!-- Tabs -->
        <q-tabs v-model="termsTab" dense align="left" class="q-mb-lg" active-color="primary" indicator-color="primary">
          <q-tab name="privacy" label="Data Privacy Policy" icon="shield" />
          <q-tab name="terms" label="Terms &amp; Conditions" icon="description" />
        </q-tabs>

        <!-- Data Privacy Policy -->
        <q-tab-panels v-model="termsTab" animated>
          <q-tab-panel name="privacy" class="q-pa-none">
            <div class="terms-content">
              <h3>Data Privacy Policy</h3>
              <p class="effective-date">Effective Date: June 2026</p>

              <h4>1. Introduction</h4>
              <p>The CSI Learning Management System (&ldquo;LMS&rdquo;) is committed to protecting your personal data in accordance with the Republic Act No. 10173, also known as the <strong>Data Privacy Act of 2012</strong> of the Philippines. This policy explains how we collect, use, and safeguard your information.</p>

              <h4>2. Information We Collect</h4>
              <ul>
                <li><strong>Personal Identification:</strong> Full name, age, contact number, home address</li>
                <li><strong>Account Credentials:</strong> Email address, encrypted password</li>
                <li><strong>Academic Data:</strong> Section/grade level, submitted assignments, quiz scores, attendance records, grades</li>
                <li><strong>Profile Photo:</strong> Used for identity verification and display purposes</li>
                <li><strong>Usage Data:</strong> Login timestamps, activity logs, and system interactions</li>
              </ul>

              <h4>3. Purpose of Data Collection</h4>
              <p>We collect and process your data solely for the following purposes:</p>
              <ul>
                <li>To create and manage your student account</li>
                <li>To facilitate learning activities, assignments, and grade tracking</li>
                <li>To monitor attendance and academic performance</li>
                <li>To communicate system updates, announcements, and notifications</li>
                <li>To ensure security and prevent unauthorized access</li>
              </ul>

              <h4>4. Data Sharing</h4>
              <p>Your personal data will only be accessible to:</p>
              <ul>
                <li>System Administrators for account management</li>
                <li>Your assigned Teachers for academic assessment</li>
                <li>Authorized school personnel for reporting purposes</li>
              </ul>
              <p>We do <strong>not</strong> sell, rent, or share your personal data with third parties for commercial purposes.</p>

              <h4>5. Data Retention</h4>
              <p>Your data will be retained for the duration of your enrollment and up to three (3) years after graduation or withdrawal, as required by academic record-keeping standards.</p>

              <h4>6. Your Rights</h4>
              <p>Under the Data Privacy Act, you have the right to:</p>
              <ul>
                <li><strong>Access</strong> your personal data held by the institution</li>
                <li><strong>Correct</strong> inaccurate or outdated information</li>
                <li><strong>Object</strong> to the processing of your data under certain conditions</li>
                <li><strong>Erasure</strong> of your data when no longer necessary</li>
              </ul>

              <h4>7. Security Measures</h4>
              <p>We implement appropriate technical and organizational measures including encrypted storage, secure authentication, and access controls to protect your data from unauthorized access, disclosure, or loss.</p>

              <h4>8. Contact</h4>
              <p>For data privacy concerns, please contact the School Data Protection Officer (DPO) through the school administration office.</p>
            </div>
          </q-tab-panel>

          <!-- Terms & Conditions -->
          <q-tab-panel name="terms" class="q-pa-none">
            <div class="terms-content">
              <h3>Terms &amp; Conditions of Use</h3>
              <p class="effective-date">Effective Date: June 2026</p>

              <h4>1. Acceptance</h4>
              <p>By creating an account and using this LMS, you agree to abide by these Terms and Conditions. Failure to comply may result in suspension or permanent termination of your account.</p>

              <h4>2. Account Responsibility</h4>
              <ul>
                <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
                <li>Do not share your account with other students or individuals.</li>
                <li>Report unauthorized access immediately to your teacher or administrator.</li>
              </ul>

              <h4>3. Academic Integrity</h4>
              <ul>
                <li>All submitted work must be your own. Plagiarism and cheating are strictly prohibited.</li>
                <li>Copy-paste, screen sharing, and screenshot features are restricted during assessments.</li>
                <li>Any attempt to circumvent security controls will be reported to school administration.</li>
              </ul>

              <h4>4. Acceptable Use</h4>
              <p>You agree to use this system only for lawful educational purposes. The following are strictly prohibited:</p>
              <ul>
                <li>Accessing other students' accounts or data</li>
                <li>Uploading malicious files or code</li>
                <li>Harassment, bullying, or inappropriate communication in chat features</li>
                <li>Attempting to reverse-engineer or tamper with the system</li>
              </ul>

              <h4>5. Intellectual Property</h4>
              <p>All course materials, modules, and content provided through this LMS are the intellectual property of the school and its instructors. Redistribution or reproduction without permission is prohibited.</p>

              <h4>6. System Availability</h4>
              <p>The school does not guarantee uninterrupted access to the LMS. Scheduled maintenance windows will be announced in advance. The school is not liable for data loss due to technical failures beyond its control.</p>

              <h4>7. Modifications</h4>
              <p>These terms may be updated from time to time. Continued use of the system after changes are posted constitutes acceptance of the revised terms.</p>

              <h4>8. Consequences of Violation</h4>
              <p>Violations of these terms may result in:</p>
              <ul>
                <li>Temporary or permanent suspension of account access</li>
                <li>Academic disciplinary action</li>
                <li>Referral to school administration or legal authorities if applicable</li>
              </ul>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-card-section class="row justify-end q-pa-md" style="border-top: 1px solid rgba(0,0,0,0.07);">
        <q-btn
          unelevated rounded color="primary"
          label="I Understand & Agree"
          icon="check_circle"
          @click="agreedToTerms = true; showTermsModal = false"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
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
const agreedToTerms = ref(false);
const showTermsModal = ref(false);
const termsTab = ref('privacy');
const showOtpModal = ref(false);
const otpCode = ref('');
const otpError = ref('');
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

  if (!agreedToTerms.value) {
    errorMsg.value = 'You must agree to the Data Privacy Policy and Terms & Conditions to register.';
    return;
  }

  if (!selectedProfilePic) {
    errorMsg.value = 'A verification photo is required. Please upload an image or take a photo.';
    return;
  }

  isLoading.value = true;
  try {
    // Check if email already exists or is valid by sending OTP
    await authStore.sendOtp(formData.value.email);
    showOtpModal.value = true;
    otpCode.value = '';
    otpError.value = '';
  } catch (error) {
    if (error?.errors) {
      const firstError = Object.values(error.errors)[0][0];
      errorMsg.value = firstError;
    } else {
      errorMsg.value = error?.message || 'Failed to send OTP. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

const completeRegistration = async () => {
  if (otpCode.value.length !== 6) {
    otpError.value = 'Please enter a valid 6-digit OTP.';
    return;
  }

  otpError.value = '';
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
      otp: otpCode.value,
    };
    
    if (selectedProfilePic) {
      payload.profile_picture = selectedProfilePic;
    }

    await authStore.register(payload);

    showOtpModal.value = false;
    successMsg.value = 'Registration successful! Please wait for admin approval.';
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (error) {
    if (error?.errors) {
      const firstError = Object.values(error.errors)[0][0];
      if (error.errors.otp) {
        otpError.value = error.errors.otp[0];
      } else {
        errorMsg.value = firstError;
        showOtpModal.value = false;
      }
    } else {
      otpError.value = error?.message || 'Registration failed. Please check your OTP.';
    }
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

.privacy-box {
  background: rgba(0, 122, 255, 0.04);
  border: 1px solid rgba(0, 122, 255, 0.15);
  border-radius: 12px;
  padding: 14px 16px;
}

.terms-content h3 {
  font-size: 20px;
  font-weight: 800;
  color: var(--sms-blue);
  margin-bottom: 4px;
}
.terms-content h4 {
  font-size: 15px;
  font-weight: 700;
  color: #222;
  margin: 20px 0 6px;
}
.terms-content p, .terms-content li {
  font-size: 14px;
  color: #444;
  line-height: 1.7;
}
.terms-content ul {
  padding-left: 20px;
}
.effective-date {
  font-size: 12px;
  color: #888;
  margin-bottom: 16px;
}
</style>
