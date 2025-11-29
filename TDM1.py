#manipulation des images dicom
import os
import easygui
import matplotlib.pyplot as plt
import pydicom
############################### Fonction 1: ouvrir un dossier
def ouvrir_dossier():
    # Ouvrir la fenêtre de dialogue pour sélectionner un dossier
    chemin_dossier = easygui.diropenbox(title="Sélectionner un dossier")
    if chemin_dossier:
        print("Dossier sélectionné:", chemin_dossier)
        return chemin_dossier
    else:
        print("Aucun dossier sélectionné.")
        return None

################################ Fonction 2:Afficher les images DICOM
def afficher_images_dicom(chemin_dossier):
    # Vérifier si le dossier existe
    if not chemin_dossier or not os.path.exists(chemin_dossier):
        print("Dossier invalide ou non sélectionné.")
        return None

    # Utiliser os.listdir() pour obtenir tous les fichiers du dossier
    fichiers_dicom = sorted(os.listdir(chemin_dossier))

    # Vérifier s'il y a des fichiers DICOM dans le dossier
    nb_images = 0
    img1= []
    dicom_data_list=[]
    # Parcourir tous les fichiers pour lire ceux qui sont DICOM
    for fichier in fichiers_dicom:
        fichier_path = os.path.join(chemin_dossier, fichier)  # Créer le chemin complet du fichier

        try:
            # Lire le fichier DICOM
            dicom_data = pydicom.dcmread(fichier_path)
            dicom_data_list.append(dicom_data)
            img = dicom_data.pixel_array
            img1.append(img)

            nb_images += 1
        except Exception as e:
            print(f"Erreur lors de la lecture de {fichier}: {e}")
            continue  # Passer à l'image suivante si une erreur se produit

    # Vérifier s'il y a des fichiers DICOM valides
    if nb_images == 0:
        print("Aucune image DICOM valide trouvée dans le dossier.")
        return None

    print("Le nombre d'images DICOM valides est :", nb_images)

#Affichage des images DICOM sur la meme figure
    cols = 15  # Nombre de colonnes dans la figure
    rows =10
    for i in range(nb_images):
        plt.subplot(rows, cols, i + 1)
        plt.imshow(img1[i], cmap=plt.cm.gray)
        plt.title(f"Image {i + 1}")
        plt.axis('off')  # Désactiver les axes

    # Ajuster l'espacement entre les sous-figures pour éviter le chevauchement
    plt.tight_layout()
    # Afficher la figure avec toutes les images DICOM
    plt.show()
    return img1,dicom_data_list # Retourner la matrice des images

################################################# Programme principal ##################################################
# Appeler la fonction pour ouvrir le dossier
chemin_dossier = ouvrir_dossier()
# Appeler la fonction pour afficher les images
if chemin_dossier:
    img,dicom_data_list = afficher_images_dicom(chemin_dossier)
    #print(dicom_data_list)
    #Accéder à une image spécifique
    index =17# Index de l'image que vous voulez afficher
    image=img[index]
    # Afficher l'image spécifique
    plt.figure()
    plt.imshow(image, cmap=plt.cm.gray)
    plt.title(f"Image {index}")
    plt.axis('off')  # Désactiver les axes
    plt.show()
    epaisseur_coupe = dicom_data_list[index].SliceThickness
    print(f"L'épaisseur de coupe pour l'image {index} est : {epaisseur_coupe} mm")
    modalite = dicom_data_list[index].Modality
    print(f"La modalité de l'image  {index} est : {modalite}")
    #TR=dicom_data_list[index].RepetitionTime
    #print(f"Le temps de répetition pour l'image {index} est : {TR} ms")
    largeur =dicom_data_list[index].WindowWidth
    print(f"La largeur de la fenetre  {index} est : {largeur}")
    centre = dicom_data_list[index].WindowCenter
    print(f"Le centre de la fenetre  {index} est : {centre}")
    slope = dicom_data_list[index].RescaleSlope
    print(f"Le slop  {index} est : {slope}")
    intercept = dicom_data_list[index].RescaleIntercept
    print(f"intercept  {index} est : {intercept}")
