<template>
  <ion-tabs>
    <ion-router-outlet />
    <ion-tab-bar slot="bottom">
      <ion-tab-button tab="Map" href="/app/map">
        <ion-icon :icon="mapOutline" />
        <ion-label>Carte</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="Dashboard" href="/app/dashboard">
        <ion-icon :icon="gridOutline" />
        <ion-label>Dashboard</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="Search" href="/app/search">
        <ion-icon :icon="searchOutline" />
        <ion-label>Recherche</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="Sync" href="/app/sync">
        <ion-icon :icon="syncOutline" />
        <ion-label>Sync</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="Profile" href="/app/profile">
        <ion-icon :icon="personOutline" />
        <ion-label>Profil</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>
</template>

<script setup>
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/vue'
import {
  mapOutline,
  gridOutline,
  searchOutline,
  syncOutline,
  personOutline
} from 'ionicons/icons'
</script>

<style scoped>
ion-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

ion-router-outlet {
  flex: 1;
  overflow: auto;
}

ion-tab-bar {
  --border: 1px solid #e0e0e0;
  --background: #ffffff;
}
</style>
