#!/bin/bash
# Script pour remplacer automatiquement les couleurs codées en dur par des variables CSS

echo "🎨 Remplacement des couleurs codées en dur par des variables CSS..."

# Fonction pour remplacer dans un fichier
replace_colors() {
  local file=$1
  
  # Remplacement des couleurs de texte
  sed -i '' 's/color: #ffc107/color: var(--ion-color-primary)/g' "$file"
  sed -i '' 's/--color: #ffc107/--color: var(--ion-color-primary)/g' "$file"
  sed -i '' 's/color: #1a1a1a/color: var(--ion-text-color)/g' "$file"
  sed -i '' 's/--color: #1a1a1a/--color: var(--ion-text-color)/g' "$file"
  sed -i '' 's/color: #ffffff/color: var(--ion-text-color)/g' "$file"
  sed-i '' 's/--color: #ffffff/--color: var(--ion-text-color)/g' "$file"
  sed -i '' 's/color: #fff/color: var(--ion-text-color)/g' "$file"
  sed -i '' 's/color: white/color: var(--ion-text-color)/g' "$file"
  
  # Remplacement des couleurs de bordure
  sed -i '' 's/border-color: #ffc107/border-color: var(--ion-color-primary)/g' "$file"
  sed -i '' 's/border-color: #ffffff/border-color: var(--ion-text-color)/g' "$file"
  
  # Remplacement des couleurs de fond
  sed -i '' 's/background-color: #ffc107/background-color: var(--ion-color-primary)/g' "$file"
  
  echo "✅ Traité: $file"
}

# Trouver tous les fichiers .vue dans src/views
for file in src/views/*.vue; do
  if [ -f "$file" ]; then
    replace_colors "$file"
  fi
done

echo "✨ Remplacement terminé!"
