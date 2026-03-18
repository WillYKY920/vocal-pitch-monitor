<script setup>
const appInfo = {
  name: 'Vocal Pitch Monitor',
  description:
      'A web-based platform for real-time vocal pitch monitoring, using signal processing and machine learning to make professional vocal training more accessible through objective feedback and personalized coaching.',
  frontend: 'Vue.js v3.5.24',
  backend: 'Spring Boot v4.0.1',
  repoName: 'WillYKY920/vocal-pitch-monitor',
  repoUrl: 'https://github.com/WillYKY920/vocal-pitch-monitor',
  license: 'MIT License',
}

const contributors = [
  'WillYKY920',
  'LucasHau1113',
  'kken0812kk'
]

const logoUrl = './logo.png'
</script>

<template>
  <div class="about-page-wrapper">
    <div class="about-content">
      <div class="logo-section">
        <img
            :src="logoUrl"
            alt="Vocal Pitch Monitor Logo"
            class="app-logo"
        />
      </div>

      <div class="info-section">
        <p class="description">
          <strong>{{ appInfo.name }}</strong> is {{ appInfo.description.toLowerCase() }}
        </p>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">Frontend</span>
            <span class="value">{{ appInfo.frontend }}</span>
          </div>

          <div class="info-item">
            <span class="label">Backend</span>
            <span class="value">{{ appInfo.backend }}</span>
          </div>

          <div class="info-item">
            <span class="label">Version</span>
            <span class="value">v1.5.0</span>
          </div>

          <div class="info-item">
            <span class="label">License</span>
            <span class="value">{{ appInfo.license }}</span>
          </div>

          <div class="info-item full-width">
            <span class="label">GitHub</span>
            <a
                :href="appInfo.repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="repo-link value"
            >
              {{ appInfo.repoName }}
            </a>
          </div>
        </div>

        <div class="contributors-section">
          <h3 class="section-title">Contributors</h3>
          <div class="contributors-list">
            <span
                v-for="contributor in contributors"
                :key="contributor"
                class="contributor-tag"
            >
              @{{ contributor }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../assets/styles/about.css';
</style>
