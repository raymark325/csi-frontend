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
            Welcome to <span class="text-gradient-blue">CSI</span>
          </h2>
          <p class="text-caption text-center" style="font-size:14px; margin:0;">
            Unified Student Services and Academic platform.
          </p>
        </div>

        <!-- Error Alert -->
        <div v-if="errorMsg" class="alert alert--danger q-mb-lg">
          <q-icon name="warning" size="20px" style="color: var(--sms-red); flex-shrink: 0; margin-top:1px"/>
          <div>
            <p style="font-weight:600; margin:0; color: var(--sms-red)">{{ errorMsg }}</p>
          </div>
        </div>

        <!-- Form Fields -->
        <form @submit.prevent="handleLogin">
          <div class="q-mb-md">
            <p class="text-label q-mb-xs">Email Address</p>
            <input
              v-model="email"
              class="input-glass"
              type="email"
              placeholder="e.g. john@sms.edu"
              required
            />
          </div>

          <div class="q-mb-xl">
            <div class="row justify-between items-center q-mb-xs">
              <p class="text-label" style="margin: 0;">Password</p>
              <router-link to="/forgot-password" style="color: var(--sms-blue); font-size: 12px; font-weight: 600; text-decoration: none;">
                Forgot Password?
              </router-link>
            </div>
            <input
              v-model="password"
              class="input-glass"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>

          <!-- Submit Button -->
          <button
            class="btn-primary full-width justify-center q-mb-lg"
            type="submit"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>

          <div class="text-center">
            <p class="text-caption" style="margin: 0; color: var(--text-secondary);">
              Don't have an account? 
              <router-link to="/register" style="color: var(--sms-blue); font-weight: 600; text-decoration: none;">
                Sign up as a Student
              </router-link>
            </p>
          </div>
        </form>
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

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMsg = ref('');

const handleLogin = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  try {
    await authStore.login(email.value, password.value);
    router.push('/');
  } catch (err) {
    errorMsg.value = err.message || 'Invalid email or password';
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
</style>
