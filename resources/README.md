# Icônes & Splash Screens

Pour générer les icônes et splash screens, utilisez le script `scripts/generate-assets.sh` ou un outil comme [Capacitor Assets](https://capacitorjs.com/solution-maker).

## Tailles requises

### iOS
- **App Icon**: 1024x1024px (PNG)
- **Splash Screen**: 2732x2732px (PNG)

### Android
- **App Icon**: 512x512px (PNG)
- **Splash Screen**: 1080x1920px (PNG)

## Génération automatique

```bash
# Installer l'outil CLI
npm install -g @capacitor/assets

# Générer à partir d'une image 1024x1024
npx cap assets generate --icon公共资源/drivio-icon.png --splash公共资源/drivio-splash.png
```

## Fichiers générés

Les icônes seront placées dans :
- `ios/App/App/Assets.xcassets/`
- `android/app/src/main/res/`

## Notes

- L'image source doit être un carré parfait (1024x1024)
- Le splash screen sera centré et adapté automatiquement
- Pour le dark mode, créez une variante claire de l'icône
