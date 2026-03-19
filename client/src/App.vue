<template>
  <div id="app" @scroll="handleScroll"> <!-- ADDED: Inline scroll listener -->
    <header>
      <div class="logo-area">
        <img src="./assets/images/icon.png" alt="Vocal Pitch Monitor Logo" class="logo-image" />
        <img src="./assets/images/vpm.png" alt="Vocal Pitch Monitor" class="logo-text" />
      </div>

      <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- Navigation -->
      <nav :class="{ 'mobile-open': isMobileMenuOpen }">
        <router-link to="/" @click="closeMenu">HOME</router-link>
        <a href="/test">TEST</a>
        <router-link to="/help" @click="closeMenu">HELP</router-link>
        <router-link to="/about" @click="closeMenu">ABOUT US</router-link>
      </nav>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      isMobileMenuOpen: false
    };
  },
  methods: {
    toggleMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    },
    closeMenu() {
      if (this.isMobileMenuOpen) {
        this.isMobileMenuOpen = false;
      }
    },
    handleScroll() {
      this.closeMenu();
    }
  },
  mounted() {
    window.addEventListener('scroll', this.handleScroll, { passive: true });
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }
};
</script>

<style>
@import './assets/styles/header.css';
</style>
