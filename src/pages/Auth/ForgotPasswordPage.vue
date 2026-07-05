<template>
  <div class="row justify-center items-center bg-gradient-mesh" style="min-height: 100vh; padding: 24px;">
    <div class="col-12 col-sm-8 col-md-6 col-lg-4">
      <div class="glass-card q-pa-xl">
        <!-- Logo Header -->
        <div class="column items-center q-mb-xl">
          <div class="logo-box q-mb-md">
            <q-icon name="school" size="32px" style="color: #fff;"/>
          </div>
          <h2 class="text-title text-center q-mt-none q-mb-xs" style="font-size: 26px; font-weight: 800;">
            Reset <span class="text-gradient-blue">Password</span>
          </h2>
          <p class="text-caption text-center" style="font-size:14px; margin:0;">
            Follow the steps to secure your account.
          </p>
        </div>

        <!-- Alerts -->
        <div v-if="errorMsg" class="alert alert--danger q-mb-lg">
          <q-icon name="warning" size="20px" style="color: var(--sms-red); flex-shrink: 0; margin-top:1px"/>
          <div>
            <p style="font-weight:600; margin:0; color: var(--sms-red)">{{ errorMsg }}</p>
          </div>
        </div>

        <div v-if="successMsg" class="alert alert--success q-mb-lg" style="background: rgba(40, 167, 69, 0.1); border-color: rgba(40, 167, 69, 0.2);">
          <q-icon name="check_circle" size="20px" style="color: #28a745; flex-shrink: 0; margin-top:1px"/>
          <div>
            <p style="font-weight:600; margin:0; color: #28a745">{{ successMsg }}</p>
          </div>
        </div>

        <!-- Step 1: Request OTP -->
        <form v-if="step === 1" @submit.prevent="handleSendOtp">
          <div class="q-mb-xl">
            <p class="text-label q-mb-xs">Email Address</p>
            <input
              v-model="email"
              class="input-glass"
              type="email"
              placeholder="e.g. john@sms.edu"
              required
            />
          </div>

          <!-- Submit Button -->
          <button
            class="btn-primary full-width justify-center q-mb-lg"
            type="submit"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Sending OTP...</span>
            <span v-else>Send OTP</span>
          </button>
        </form>

        <!-- Step 2: Reset Password -->
        <form v-else-if="step === 2" @submit.prevent="handleResetPassword">
          <div class="q-mb-md">
            <p class="text-label q-mb-xs">6-Digit OTP</p>
            <input
              v-model="otp"
              class="input-glass text-center"
              type="text"
              placeholder="000000"
              maxlength="6"
              style="letter-spacing: 4px; font-size: 18px;"
              required
            />
          </div>

          <div class="q-mb-md">
            <p class="text-label q-mb-xs">New Password</p>
            <input
              v-model="password"
              class="input-glass"
              type="password"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </div>

          <div class="q-mb-xl">
            <p class="text-label q-mb-xs">Confirm New Password</p>
            <input
              v-model="confirmPassword"
              class="input-glass"
              type="password"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </div>

          <!-- Submit Button -->
          <button
            class="btn-primary full-width justify-center q-mb-lg"
            type="submit"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Resetting...</span>
            <span v-else>Reset Password</span>
          </button>
        </form>

        <div class="text-center">
          <p class="text-caption" style="margin: 0; color: var(--text-secondary);">
            Remember your password? 
            <router-link to="/login" style="color: var(--sms-blue); font-weight: 600; text-decoration: none;">
              Sign In
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const step = ref(1);
const email = ref('');
const otp = ref('');
const password = ref('');
const confirmPassword = ref('');

const isLoading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const handleSendOtp = async () => {
  if (!email.value) return;
  isLoading.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    await authStore.sendForgotPasswordOtp(email.value);
    successMsg.value = 'An OTP has been sent to your email address.';
    step.value = 2;
  } catch (err) {
    errorMsg.value = err.message || 'Failed to send OTP';
  } finally {
    isLoading.value = false;
  }
};

const handleResetPassword = async () => {
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Passwords do not match';
    return;
  }

  if (otp.value.length !== 6) {
    errorMsg.value = 'OTP must be 6 digits';
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  try {
    await authStore.resetPassword(email.value, otp.value, password.value);
    successMsg.value = 'Your password has been successfully reset. Redirecting to login...';
    setTimeout(() => {
      router.push('/login');
    }, 2500);
  } catch (err) {
    errorMsg.value = err.message || 'Failed to reset password';
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

.alert {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
}

.alert--danger {
  background: rgba(220, 53, 69, 0.1);
  border-color: rgba(220, 53, 69, 0.2);
}
</style>
