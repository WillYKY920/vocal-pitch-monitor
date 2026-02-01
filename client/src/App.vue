<script setup>
</script>

<template>
  <div id="app">
    <header>
      <div class="logo-area">
        <div class="logo-icon"></div>
        <span>Pitch Detection Monitor</span>
      </div>
      <nav>
        <router-link to="/">HOME</router-link>
        <router-link to="/test">TEST</router-link>
        <router-link to="/help">HELP</router-link>
        <router-link to="/about">ABOUT US</router-link>
      </nav>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
@import './assets/styles/header.css';
</style>
