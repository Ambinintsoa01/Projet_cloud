import { ref } from 'vue'
import { 
  getStorage, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage'
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc
} from 'firebase/firestore'
import { db, storage } from './firebase.service'
import { Camera } from '@capacitor/camera'

export const reportService = {
  /**
   * Upload une image et retourne son URL
   */
  async uploadImage(imageFile, reportId, imageName) {
    try {
      const storageRef = ref(storage, `reports/${reportId}/${imageName}`)
      
      // Convertir File en ArrayBuffer pour Capacitor
      let arrayBuffer
      if (imageFile instanceof File) {
        arrayBuffer = await imageFile.arrayBuffer()
      } else {
        // Pour les images provenant de Camera
        arrayBuffer = this._base64ToArrayBuffer(imageFile.dataUrl)
      }
      
      const snapshot = await uploadBytes(storageRef, arrayBuffer)
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return {
        url: downloadURL,
        path: snapshot.ref.fullPath,
        name: imageName
      }
    } catch (error) {
      console.error('Erreur upload image:', error)
      throw new Error('Impossible d\'uploader l\'image')
    }
  },

  /**
   * Crée un nouveau signalement avec photos
   */
  async createReportWithPhotos(reportData, photos) {
    try {
      // Créer le document du signalement
      const reportRef = await addDoc(collection(db, 'reports'), {
        ...reportData,
        createdAt: serverTimestamp(),
        status: 'new',
        photos: [], // Sera mis à jour après upload
        photoCount: photos.length
      })

      const reportId = reportRef.id
      
      // Upload des photos
      const uploadedPhotos = []
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const imageName = `photo_${i + 1}_${Date.now()}.jpg`
        
        const uploadedPhoto = await this.uploadImage(photo, reportId, imageName)
        uploadedPhotos.push({
          ...uploadedPhoto,
          uploadedAt: serverTimestamp(),
          order: i
        })
      }

      // Mettre à jour le document avec les URLs des photos
      await setDoc(doc(db, 'reports', reportId), {
        photos: uploadedPhotos
      }, { merge: true })

      return {
        success: true,
        reportId,
        photoCount: uploadedPhotos.length
      }
    } catch (error) {
      console.error('Erreur création signalement:', error)
      throw new Error('Impossible de créer le signalement')
    }
  },

  /**
   * Prend une photo avec l'appareil
   */
  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: 'dataUrl',
        source: 'camera'
      })

      return {
        dataUrl: image.dataUrl,
        id: Date.now().toString(),
        name: `photo_${Date.now()}.jpg`
      }
    } catch (error) {
      console.error('Erreur prise photo:', error)
      throw new Error('Impossible de prendre une photo')
    }
  },

  /**
   * Sélectionne une photo depuis la galerie
   */
  async pickPhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: 'dataUrl',
        source: 'photos'
      })

      return {
        dataUrl: image.dataUrl,
        id: Date.now().toString(),
        name: `photo_${Date.now()}.jpg`
      }
    } catch (error) {
      console.error('Erreur sélection photo:', error)
      throw new Error('Impossible de sélectionner une photo')
    }
  },

  /**
   * Convertit base64 en ArrayBuffer
   */
  _base64ToArrayBuffer(base64) {
    const binaryString = atob(base64.split(',')[1])
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }
}
