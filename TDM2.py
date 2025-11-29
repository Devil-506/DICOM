import os
import easygui
import matplotlib.pyplot as plt
import pydicom
import numpy as np

############################### Ouvrir un dossier
def ouvrir_dossier():
    """Ouvre une boîte de dialogue pour sélectionner un dossier."""
    chemin_dossier = easygui.diropenbox(title="Sélectionner un dossier DICOM")
    if chemin_dossier:
        print("Dossier sélectionné :", chemin_dossier)
        return chemin_dossier
    else:
        print("Aucun dossier sélectionné.")
        return None

################################ Fonction : Fenêtrage des images TDM
def window_image(img, window_center, window_width, intercept, slope, rescale=False):
    """Applique le fenêtrage d’une image DICOM selon les paramètres donnés."""
    # Conversion en unités HU
    img_hu = img * slope + intercept

    # Calcul des limites de fenêtre
    img_min = window_center - (window_width / 2)
    img_max = window_center + (window_width / 2)

    # Appliquer les limites
    img_windowed = np.clip(img_hu, img_min, img_max)

    # Option : normalisation entre 0 et 255 pour affichage
    if rescale:
        img_windowed = ((img_windowed - img_min) / (img_max - img_min)) * 255.0
        img_windowed = img_windowed.astype(np.uint8)

    return img_windowed, img_hu

################################ Afficher et traiter les images DICOM
def afficher_images_dicom(chemin_dossier):
    """Charge, fenêtre et affiche les images DICOM d’un dossier."""
    if not chemin_dossier or not os.path.exists(chemin_dossier):
        print("Dossier invalide ou non sélectionné.")
        return None, None

    fichiers_dicom = sorted(os.listdir(chemin_dossier))
    images_fenetrees = []
    images_hu = []
    nb_images = 0

    for fichier in fichiers_dicom:
        fichier_path = os.path.join(chemin_dossier, fichier)
        try:
            dicom_data = pydicom.dcmread(fichier_path)
            img = dicom_data.pixel_array

            # Récupérer les métadonnées avec valeurs par défaut
            window_center = getattr(dicom_data, 'WindowCenter', np.mean(img))
            window_width = getattr(dicom_data, 'WindowWidth', np.ptp(img))
            intercept = getattr(dicom_data, 'RescaleIntercept', 0)
            slope = getattr(dicom_data, 'RescaleSlope', 1)

            # Gérer le cas MultiValue
            if isinstance(window_center, pydicom.multival.MultiValue):
                window_center = window_center[0]
            if isinstance(window_width, pydicom.multival.MultiValue):
                window_width = window_width[0]

            # Appliquer le fenêtrage
            img_windowed, img_hu = window_image(img, window_center, window_width, intercept, slope)

            images_fenetrees.append(img_windowed)
            images_hu.append(img_hu)
            nb_images += 1

        except Exception as e:
            print(f"Erreur lors de la lecture de {fichier} : {e}")
            continue

    if nb_images == 0:
        print("Aucune image DICOM valide trouvée dans le dossier.")
        return None, None

    print(f"Nombre d’images DICOM valides : {nb_images}")

    # Affichage d’un aperçu (limité à 30 images pour lisibilité)
    n = min(nb_images, 30)
    cols = 6
    rows = int(np.ceil(n / cols))

    plt.figure(figsize=(15, rows * 2))
    for i in range(n):
        plt.subplot(rows, cols, i + 1)
        plt.imshow(images_fenetrees[i], cmap='gray')
        plt.title(f"Image {i + 1}")
        plt.axis('off')
    plt.tight_layout()
    plt.show()

    return np.array(images_fenetrees), np.array(images_hu)

################################################# Programme principal ##################################################
if __name__ == "__main__":
    chemin_dossier = ouvrir_dossier()
    if chemin_dossier:
        images_fenetrees, images_hu = afficher_images_dicom(chemin_dossier)

        if images_fenetrees is not None:
            print("Nombre d’images fenêtrées :", images_fenetrees.shape[0])

            # Choisir un index valide
            index = min(65, images_fenetrees.shape[0] - 1)

            image_avant = images_hu[index]
            image_apres = images_fenetrees[index]

            plt.figure(figsize=(10, 5))
            plt.subplot(1, 2, 1)
            plt.imshow(image_avant, cmap='gray')
            plt.title(f"Image avant fenêtrage (HU) {index}")
            plt.axis('off')

            plt.subplot(1, 2, 2)
            plt.imshow(image_apres, cmap='gray')
            plt.title(f"Image fenêtrée {index}")
            plt.axis('off')

            plt.tight_layout()
            plt.show()
