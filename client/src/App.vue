<script setup>
</script>

<template>
  <div id="app">
    <header>
      <div class="logo-area">
        <div class="logo-icon"></div>
        <span>Pitch Detection Monitor</span>
      </div>

      <!-- Hamburger Menu Button (Mobile Only) -->
      <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- Navigation -->
      <nav :class="{ 'mobile-open': isMobileMenuOpen }">
        <router-link to="/" @click="closeMenu">HOME</router-link>
        <router-link to="/test" @click="closeMenu">TEST</router-link>
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
      this.isMobileMenuOpen = false;
    }
  }
};
</script>


<style>
@import './assets/styles/header.css';
</style>
