import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

// Import des vues (lazy loading pour les performances)
const LoginScreen = () => import('@/views/LoginScreen.vue')
const RegisterScreen = () => import('@/views/RegisterScreen.vue')
const VisitorLandingScreen = () => import('@/views/VisitorLandingScreen.vue')
const VisitorMapScreen = () => import('@/views/VisitorMapScreen.vue')
const AppTabs = () => import('@/components/AppTabs.vue')
const MainMapScreen = () => import('@/views/MainMapScreen.vue')
const ReportFormScreen = () => import('@/views/ReportFormScreen.vue')
const MapReportScreen = () => import('@/views/MapReportScreen.vue')
const DashboardScreen = () => import('@/views/DashboardScreen.vue')
const ProfileScreen = () => import('@/views/ProfileScreen.vue')
const SearchScreen = () => import('@/views/SearchScreen.vue')
const ManagerProblemesScreen = () => import('@/views/ManagerProblemesScreen.vue')

const routes = [
  {
    path: '/',
    redirect: '/visitor-map'
  },
  {
    path: '/visitor',
    name: 'VisitorLanding',
    component: VisitorMapScreen,
    meta: { requiresAuth: false, showTabs: false }
  },
  {
    path: '/visitor-map',
    name: 'VisitorMap',
    component: VisitorMapScreen,
    meta: { requiresAuth: false, showTabs: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginScreen,
    meta: { requiresAuth: false, showTabs: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterScreen,
    meta: { requiresAuth: false, showTabs: false }
  },
  {
    path: '/map',
    name: 'Map',
    component: MainMapScreen,
    meta: { requiresAuth: true, showTabs: true }
  },
  {
    path: '/report/new',
    name: 'NewReport',
    component: ReportFormScreen,
    meta: { requiresAuth: true, showTabs: false }
  },
  {
    path: '/report/map',
    name: 'MapReport',
    component: MapReportScreen,
    meta: { requiresAuth: true, showTabs: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardScreen,
    meta: { requiresAuth: true, showTabs: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileScreen,
    meta: { requiresAuth: true, showTabs: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: SearchScreen,
    meta: { requiresAuth: true, showTabs: true }
  },
  {
    path: '/manager/problemes',
    name: 'ManagerProblemes',
    component: ManagerProblemesScreen,
    meta: { requiresAuth: true, requiresRole: 'MANAGER', showTabs: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/visitor-map'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Comportement de scroll pour une meilleure UX
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Guards de navigation
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Vérifier la connexion online - DÉSACTIVÉ POUR LE DÉVELOPPEMENT
  // const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  
  // Si offline et pas sur la page login, rediriger vers login avec message
  // if (!isOnline && to.name !== 'Login') {
  //   console.warn('Accès refusé - application hors ligne')
  //   next({ name: 'Login' })
  //   return
  // }

  // Vérifier si la route nécessite une authentification
  if (to.meta.requiresAuth) {
    // DÉSACTIVÉ POUR LE DÉVELOPPEMENT - ACCÈS DIRECT À TOUTES LES PAGES
    console.log('Route protégée:', to.name)
  }

  // Vérifier si la route nécessite un rôle spécifique
  if (to.meta.requiresRole) {
    // DÉSACTIVÉ POUR LE DÉVELOPPEMENT
    console.log('Route avec rôle requis:', to.meta.requiresRole)
  }

  // COMMENTÉ: Redirection automatique des pages auth quand déjà connecté
  // Si vous voulez pouvoir accéder aux pages login/register même quand connecté,
  // décommentez cette section :
  /*
  if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
    next({ name: 'Map' })
    return
  }
  */

  // Auto-redirect to Map if accessing /app without specific route
  if (to.path === '/app') {
    next({ name: 'Map' })
    return
  }

  next()
})

export default router
