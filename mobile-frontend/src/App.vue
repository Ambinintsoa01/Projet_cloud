<template>
  <ion-app>
    <div class="router-view-wrapper">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </div>
    
    <!-- Simple tab bar at bottom (not using IonTabs component) -->
    <div v-if="showTabs" class="bottom-tab-bar">
      <router-link to="/map" :class="{ active: isActiveTab('Map') }" class="tab-link">
        <ion-icon :icon="mapOutline" />
        <span>Carte</span>
      </router-link>

      <router-link to="/dashboard" :class="{ active: isActiveTab('Dashboard') }" class="tab-link">
        <ion-icon :icon="gridOutline" />
        <span>Dashboard</span>
      </router-link>

      <router-link to="/search" :class="{ active: isActiveTab('Search') }" class="tab-link">
        <ion-icon :icon="searchOutline" />
        <span>Recherche</span>
      </router-link>

      <router-link to="/profile" :class="{ active: isActiveTab('Profile') }" class="tab-link">
        <ion-icon :icon="personOutline" />
        <span>Profil</span>
      </router-link>
    </div>
  </ion-app>
</template>

<script setup>
import { IonApp, IonIcon } from '@ionic/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  mapOutline,
  gridOutline,
  searchOutline,
  personOutline
} from 'ionicons/icons'

const route = useRoute()

const showTabs = computed(() => {
  return route.meta?.showTabs === true
})

const isActiveTab = (tabName) => {
  return route.name === tabName
}
</script>

<style>
* {
  box-sizing: border-box;
}

:root {
  /* Couleurs principales - Thème routier noir & jaune */
  --color-primary: #FFC107;
  --color-primary-dark: #FFA000;
  --color-primary-light: #FFECB3;
  
  /* Backgrounds */
  --color-dark: #0A0A0A;
  --color-darker: #000000;
  --color-surface: #1C1C1E;
  --color-surface-elevated: #2C2C2E;
  
  /* Text */
  --color-text: #FFFFFF;
  --color-text-secondary: #98989D;
  --color-text-tertiary: #6C6C70;
  
  /* Status colors */
  --color-danger: #FF3B30;
  --color-warning: #FF9500;
  --color-success: #34C759;
  
  /* Borders */
  --border-color: rgba(255, 193, 7, 0.15);
  --border-color-strong: rgba(255, 193, 7, 0.3);
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.6);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.7);
  --shadow-glow: 0 0 20px rgba(255, 193, 7, 0.3);
}

ion-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  --ion-background-color: var(--color-dark);
  --ion-text-color: var(--color-text);
  --ion-text-color-rgb: 255, 255, 255;
}

/* Router view takes remaining space */
:deep(.router-view-wrapper) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Global page styling - Dark theme with yellow accents */
:deep(ion-page) {
  background: var(--color-dark);
  --background: var(--color-dark);
}

:deep(ion-header) {
  background: var(--color-darker);
  box-shadow: var(--shadow-md);
  border-bottom: 2px solid var(--color-primary);
}

:deep(ion-toolbar) {
  --background: var(--color-darker);
  --color: var(--color-text);
  --border-color: transparent;
  --padding-top: 8px;
  --padding-bottom: 8px;
  --min-height: 56px;
}

:deep(ion-title) {
  color: var(--color-text);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

:deep(ion-content) {
  --background: var(--color-dark);
  --ion-text-color: var(--color-text);
  color: var(--color-text);
}

:deep(ion-label) {
  color: var(--color-text) !important;
}

:deep(ion-item) {
  --background: var(--color-surface);
  --color: var(--color-text);
  --border-color: var(--border-color);
  --highlight-height: 0;
  --inner-border-width: 0;
  --padding-start: 16px;
  --padding-end: 16px;
}

:deep(ion-item::part(native)) {
  border-radius: 12px;
}

:deep(ion-input) {
  --color: var(--color-text);
  --placeholder-color: var(--color-text-secondary);
}

:deep(ion-textarea) {
  --color: var(--color-text);
  --placeholder-color: var(--color-text-secondary);
}

:deep(ion-searchbar) {
  --color: var(--color-text);
  --icon-color: var(--color-primary);
  --placeholder-color: var(--color-text-secondary);
  --background: var(--color-surface);
  --border-radius: 24px;
  --box-shadow: var(--shadow-sm);
  padding: 12px;
}

:deep(h1, h2, h3, h4, h5, h6) {
  color: var(--color-text);
  font-weight: 700;
}

:deep(p) {
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Buttons */
:deep(ion-button) {
  --color: var(--color-primary);
  --border-radius: 12px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(ion-button[fill="solid"]) {
  --background: var(--color-primary);
  --color: var(--color-darker);
  --box-shadow: var(--shadow-md);
}

:deep(ion-button[fill="solid"]:hover) {
  --background: var(--color-primary-dark);
}

:deep(ion-button[fill="outline"]) {
  --color: var(--color-primary);
  --border-color: var(--color-primary);
  --border-width: 2px;
}

:deep(ion-button[fill="clear"]) {
  --color: var(--color-primary);
}

/* Cards */
:deep(ion-card) {
  --background: var(--color-surface);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  margin: 12px;
}

:deep(ion-card-header) {
  background: var(--color-surface-elevated);
  border-bottom: 1px solid var(--border-color);
}

:deep(ion-card-title) {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 18px;
}

:deep(ion-badge) {
  --background: var(--color-primary);
  --color: var(--color-darker);
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
  letter-spacing: 0.3px;
}

:deep(ion-badge[color="danger"]) {
  --background: var(--color-danger);
  --color: white;
}

:deep(ion-badge[color="warning"]) {
  --background: var(--color-warning);
  --color: var(--color-darker);
}

:deep(ion-badge[color="success"]) {
  --background: var(--color-success);
  --color: white;
}

/* Segment */
:deep(ion-segment) {
  --background: var(--color-surface);
  border-radius: 12px;
  padding: 4px;
}

:deep(ion-segment-button) {
  --color: var(--color-text-secondary);
  --color-checked: var(--color-darker);
  --indicator-color: var(--color-primary);
  --border-radius: 8px;
  font-weight: 600;
  min-height: 36px;
  text-transform: none;
}

/* FAB Buttons */
:deep(ion-fab-button) {
  --background: var(--color-primary);
  --color: var(--color-darker);
  --box-shadow: var(--shadow-lg), var(--shadow-glow);
  width: 56px;
  height: 56px;
}

:deep(ion-fab-button:hover) {
  --background: var(--color-primary-dark);
}

:deep(ion-fab-button ion-icon) {
  font-size: 28px;
}

/* Scrollbar */
:deep(::-webkit-scrollbar) {
  width: 8px;
}

:deep(::-webkit-scrollbar-track) {
  background: var(--color-surface);
}

:deep(::-webkit-scrollbar-thumb) {
  background: var(--color-primary);
  border-radius: 4px;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  --background: var(--color-primary-dark);
}

/* Tab bar at bottom */
.bottom-tab-bar {
  flex: 0 0 60px;
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  background: var(--color-darker);
  border-top: 2px solid var(--color-primary);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.6);
  gap: 0;
  position: relative;
}

.bottom-tab-bar::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-primary), transparent);
}

.tab-link {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-decoration: none;
  border: none;
  background: none;
  cursor: pointer;
  border-top: 3px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tab-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.tab-link:active {
  transform: scale(0.95);
}

.tab-link.active::before {
  width: 60%;
}

.tab-link.active {
  color: var(--color-primary);
  background: rgba(255, 193, 7, 0.08);
}

.tab-link.active ion-icon {
  filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.6));
}

.tab-link ion-icon {
  font-size: 26px;
  transition: all 0.3s ease;
}

/* Loading states */
:deep(ion-spinner) {
  --color: var(--color-primary);
}

/* Modals */
:deep(ion-modal) {
  --background: var(--color-dark);
  --border-radius: 16px;
}

:deep(ion-modal ion-toolbar) {
  --background: var(--color-darker);
  border-bottom: 1px solid var(--border-color-strong);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .bottom-tab-bar {
    flex: 0 0 56px;
  }
  
  .tab-link ion-icon {
    font-size: 24px;
  }
  
  .tab-link {
    font-size: 9px;
  }
}

/* Safe area handling */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bottom-tab-bar {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>