<template>
  <div class="landing-page">
    <!-- Navigation -->
    <nav class="glass-nav">
      <div class="row justify-between items-center" style="width: 100%; max-width: 1200px; margin: 0 auto;">
        <div class="row items-center q-gutter-sm">
          <div style="width:40px; height:40px; border-radius:12px; background: linear-gradient(135deg, var(--sms-blue), var(--sms-blue-light)); display:flex; align-items:center; justify-content:center;">
            <q-icon name="school" size="24px" style="color:#fff"/>
          </div>
          <div>
            <h1 style="font-weight:800; font-size:20px; color: var(--text-primary); margin:0; line-height:1.1;">CSI</h1>
            <p style="font-size:12px; color: var(--text-muted); margin:0;">Unified Student Services and Academic platform</p>
          </div>
        </div>

        <div class="row items-center q-gutter-md">
          <q-btn flat no-caps label="Features" class="gt-xs text-secondary" />
          <q-btn flat no-caps label="About" class="gt-xs text-secondary" />
          <q-btn
            v-if="isLoggedIn"
            unelevated
            no-caps
            rounded
            color="primary"
            label="Go to Dashboard"
            to="/dashboard"
            style="padding: 8px 24px; font-weight: 600;"
          />
          <q-btn
            v-else
            unelevated
            no-caps
            rounded
            color="primary"
            label="Log In"
            to="/login"
            style="padding: 8px 24px; font-weight: 600;"
          />
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section text-center">
      <div class="container">
        <div class="badge-pill q-mb-lg">
          <q-icon name="stars" color="primary" class="q-mr-sm" />
          Welcome to the future of education
        </div>
        <h1 class="hero-title q-mb-md">
          Empowering schools with <br> <span class="gradient-text">intelligent management</span>
        </h1>
        <p class="hero-subtitle q-mb-xl">
          Streamline your grading, manage class schedules, track attendance, and deliver engaging LMS modules—all from a single, beautifully designed platform.
        </p>

        <div class="row justify-center q-gutter-md">
          <q-btn
            v-if="isLoggedIn"
            unelevated
            no-caps
            rounded
            size="lg"
            color="primary"
            label="Enter Dashboard"
            to="/dashboard"
            class="hero-btn"
          />
          <q-btn
            v-else
            unelevated
            no-caps
            rounded
            size="lg"
            color="primary"
            label="Get Started"
            to="/login"
            class="hero-btn"
          />
          <q-btn
            outline
            no-caps
            rounded
            size="lg"
            color="primary"
            label="Learn More"
            class="hero-btn q-mr-sm"
          />
          <q-btn
            outline
            no-caps
            rounded
            size="lg"
            color="accent"
            icon="android"
            label="Download APK"
            href="https://github.com/raymark325/csi-frontend/releases/download/latest/app-debug.apk"
            target="_blank"
            class="hero-btn"
          />
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <div class="row q-col-gutter-xl">
          <!-- Feature 1 -->
          <div class="col-12 col-md-4">
            <div class="glass-card feature-card text-center">
              <div class="feature-icon bg-blue">
                <q-icon name="grade" size="32px" color="white" />
              </div>
              <h3>Smart Grading System</h3>
              <p>Dynamic rubrics, instant analytics, and automated report card generation for teachers.</p>
            </div>
          </div>
          <!-- Feature 2 -->
          <div class="col-12 col-md-4">
            <div class="glass-card feature-card text-center">
              <div class="feature-icon bg-purple">
                <q-icon name="menu_book" size="32px" color="white" />
              </div>
              <h3>Integrated LMS</h3>
              <p>Host modules, assignments, and learning resources seamlessly tied to your courses.</p>
            </div>
          </div>
          <!-- Feature 3 -->
          <div class="col-12 col-md-4">
            <div class="glass-card feature-card text-center">
              <div class="feature-icon bg-green">
                <q-icon name="how_to_reg" size="32px" color="white" />
              </div>
              <h3>Attendance Tracking</h3>
              <p>Easily monitor daily attendance, highlight patterns, and export comprehensive reports.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <footer class="q-py-lg text-center" style="border-top: 1px solid rgba(255,255,255,0.05); margin-top: 40px;">
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">
        &copy; 2026 CSI Unified Student Services and Academic platform. Developed by Maharlika Technology.
      </p>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const isLoggedIn = computed(() => !!authStore.token);
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: #0f0f13;
  color: #fff;
  font-family: 'Inter', -apple-system, sans-serif;
  overflow-x: hidden;
  position: relative;
}

/* Background Gradients */
.landing-page::before {
  content: '';
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(0,122,255,0.15) 0%, rgba(0,0,0,0) 70%);
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* Nav */
.glass-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 80px;
  background: rgba(15, 15, 19, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  padding: 0 24px;
  z-index: 1000;
}

/* Hero */
.hero-section {
  padding: 160px 0 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
@media (min-width: 768px) {
  .hero-section {
    padding: 200px 0 120px;
  }
}

.badge-pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 30px;
  background: rgba(0, 122, 255, 0.1);
  color: var(--sms-blue);
  font-size: 14px;
  font-weight: 600;
  border: 1px solid rgba(0, 122, 255, 0.2);
}

.hero-title {
  font-size: clamp(36px, 8vw, 64px);
  font-weight: 800;
  line-height: 1.2;
  color: #ffffff;
  letter-spacing: -1px;
}

.gradient-text {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: clamp(16px, 4vw, 20px);
  line-height: 1.6;
  color: rgba(255,255,255,0.6);
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

.hero-btn {
  padding: 12px 24px;
  font-weight: 700;
  font-size: 16px;
  width: 100%;
}
@media (min-width: 600px) {
  .hero-btn {
    width: auto;
    padding: 12px 32px;
  }
}

/* Features */
.features-section {
  padding: 80px 0 120px;
}

.feature-card {
  padding: 40px 30px;
  height: 100%;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 24px;
  transition: transform 0.3s;
}
.feature-card:hover {
  transform: translateY(-8px);
  background: rgba(255,255,255,0.03);
}

.feature-icon {
  width: 64px; height: 64px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 24px;
}
.bg-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.bg-purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.bg-green { background: linear-gradient(135deg, #10b981, #059669); }

.feature-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #fff;
}
.feature-card p {
  font-size: 15px;
  color: rgba(255,255,255,0.6);
  line-height: 1.6;
  margin: 0;
}
</style>
