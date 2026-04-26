<script setup>
</script>

<template>
  <div class="help-page-wrapper">
    <article class="help-content">
      <div class="page-header">
        <h1>Welcome to Vocal Pitch Monitor</h1>
        <h2 class="subtitle">Your Personal Vocal Coach</h2>
      </div>

      <section class="help-section">
        <h2>The Purpose of Our Application</h2>
        <p>
          Whether you are an aspiring singer, a hobbyist, or a musician looking to refine your skills, practicing vocal pitch can often feel like a guessing game. That is why we built the <strong>Vocal Pitch Monitor</strong>, a web-based platform designed to provide real-time, objective feedback on your singing.
        </p>
        <p>
          By leveraging advanced signal processing and machine learning, our application "listens" to your singing and plots your vocal pitch in real-time. Instead of relying solely on your ears, you can visually track your notes against the actual melody of the song, making it easier to identify areas for improvement and master your vocal control.
        </p>
      </section>

      <section class="help-section">
        <h2>How to Use the Pitch Detection Monitor</h2>
        <p>
          Using the application is straightforward. The interface is divided into a real-time tracking graph and a lower control panel for song selection and audio settings.
        </p>

        <div class="step-guide">

          <div class="step">
            <h3>1. Set Up Your Microphone</h3>
            <p>
              Before you start singing, ensure your microphone is properly connected. Look for the microphone icon in the bottom control bar. Use the dropdown menu next to it to select your preferred input device (e.g., your default desktop microphone or an external audio interface).
            </p>
          </div>

          <div class="step">
            <h3>2. Select Your Track</h3>
            <p>
              In the bottom-left panel, you will find our music library. Start by browsing the <strong>Artists</strong> list and click on one to reveal their available tracks under the <strong>Songs</strong> column. Selecting a song will load it into the player.
            </p>
          </div>

          <div class="step">
            <h3>3. Play and Sing Along</h3>
            <p>
              Once your song is selected and your microphone is ready, press the purple <strong>Play</strong> button. As the song plays, the large main window will actively display pitch lines across the musical scale (A2 to D5+). You can use the playback progress bar to skip to specific parts of the song or adjust the backing track's volume using the speaker slider.
            </p>
          </div>
        </div>
      </section>

      <section class="declaration-box">
        <h2>Usage Declaration</h2>
        <p>
          This application is developed strictly for <strong>educational and training purposes</strong>. Its primary goal is to assist musicians and enthusiasts in practicing their vocal pitch skills through objective feedback and analysis.
        </p>
        <p class="warning-text">
          This application does not advocate, endorse, or facilitate the piracy of copyrighted songs. Users are expected to utilize obtained audio files ONLY for their practice sessions.
        </p>
      </section>
    </article>
  </div>
</template>

<style scoped>
@import '../assets/styles/help.css';
</style>
