import os
import easygui
import matplotlib.pyplot as plt
import pydicom
import numpy as np


############################### Ouvrir un dossier
def ouvrir_dossier():
    chemin_dossier = easygui.diropenbox(title="Sélectionner un dossier")
    if chemin_dossier:
        print("Dossier sélectionné:", chemin_dossier)
        return chemin_dossier
    else:
        print("Aucun dossier sélectionné.")
        return None


################################ Fonction de transformation en HU (sans fenêtrage)
def convertir_en_HU(img, intercept, slope):
    return (img * slope + intercept)


################################ Fonction de fenêtrage pour l'affichage
def window_image(img, window_center, window_width):
    img_min = window_center - window_width // 2
    img_max = window_center + window_width // 2
    img[img < img_min] = img_min
    img[img > img_max] = img_max

    return img


################################ Afficher des images scanner fenêtrées
def afficher_images_dicom(chemin_dossier):
    if not chemin_dossier or not os.path.exists(chemin_dossier):
        print("Dossier invalide ou non sélectionné.")
        return None

    fichiers_dicom = sorted(os.listdir(chemin_dossier))
    images_fenetrees = []

    for fichier in fichiers_dicom:
        fichier_path = os.path.join(chemin_dossier, fichier)

        try:
            dicom_data = pydicom.dcmread(fichier_path)
            img = dicom_data.pixel_array
            window_center = dicom_data.WindowCenter if hasattr(dicom_data, 'WindowCenter') else np.mean(img)
            window_width = dicom_data.WindowWidth if hasattr(dicom_data, 'WindowWidth') else np.ptp(img)
            intercept = dicom_data.RescaleIntercept if hasattr(dicom_data, 'RescaleIntercept') else 0
            slope = dicom_data.RescaleSlope if hasattr(dicom_data, 'RescaleSlope') else 1

            if isinstance(window_center, pydicom.multival.MultiValue):
                window_center = window_center[0]
            if isinstance(window_width, pydicom.multival.MultiValue):
                window_width = window_width[0]

            # Convertir l'image en HU (avant le fenêtrage)
            img_HU = convertir_en_HU(img, intercept, slope)
            # Appliquer le fenêtrage pour l'affichage
            image_fenetree = window_image(img_HU.copy(), window_center, window_width)
            images_fenetrees.append((img_HU, image_fenetree))
        except Exception as e:
            print(f"Erreur lors de la lecture de {fichier}: {e}")

    if not images_fenetrees:
        print("Aucune image DICOM valide trouvée dans le dossier.")
        return None

    print("Le nombre d'images DICOM valides est :", len(images_fenetrees))
    return images_fenetrees


################################ Fonction pour enregistrer les moyennes des ROIs et symétries dans un fichier texte
def enregistrer_moyennes_dans_fichier(moyennes_rois, moyennes_symetries, nom_fichier="moyennes_roi_symetries.txt"):
    try:
        with open(nom_fichier, 'w') as fichier:
            fichier.write("ROI\tSymétrie\n")
            for i in range(len(moyennes_rois)):
                fichier.write(f"{moyennes_rois[i]:.2f}\t{moyennes_symetries[i]:.2f}\n")
        print(f"Les moyennes ont été enregistrées dans le fichier '{nom_fichier}'.")
    except Exception as e:
        print(f"Erreur lors de l'enregistrement dans le fichier: {e}")


################################ Tracer sept formes et leurs symétries
def tracer_formes(images):
    img_HU, image_fenetree = images  # image en HU et image fenêtrée pour affichage
    fig, ax = plt.subplots()
    ax.imshow(image_fenetree, cmap=plt.cm.gray)
    ax.set_title("Cliquez pour dessiner les formes (Double-cliquez pour finir chaque forme)")
    ax.axis('off')

    # Ajouter 7 couleurs pour chaque ROI
    couleurs = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink']
    formes = []  # Liste pour stocker les coordonnées des formes
    couleur_index = 0  # Index pour alterner les couleurs

    moyennes_rois = []  # Liste pour stocker les moyennes des ROIs
    moyennes_symetries = []  # Liste pour stocker les moyennes des symétries

    def start_drawing(event):
        if event.inaxes is not None:
            # Si l'index de couleur n'existe pas encore dans formes, on l'initialise
            if len(formes) <= couleur_index:
                formes.append(([], []))  # Crée une nouvelle forme (x, y)

            formes[couleur_index][0].append(event.xdata)
            formes[couleur_index][1].append(event.ydata)
            ax.plot(formes[couleur_index][0], formes[couleur_index][1], color=couleurs[couleur_index])
            plt.draw()

    def draw_line(event):
        if event.inaxes is not None and formes:
            # S'assurer que la forme courante existe
            if len(formes) > couleur_index:
                formes[couleur_index][0].append(event.xdata)
                formes[couleur_index][1].append(event.ydata)
                ax.plot(formes[couleur_index][0], formes[couleur_index][1], color=couleurs[couleur_index])
                plt.draw()

    def finish_drawing(event):
        nonlocal couleur_index
        if event.inaxes is not None:
            # Fermer la forme
            formes[couleur_index][0].append(formes[couleur_index][0][0])
            formes[couleur_index][1].append(formes[couleur_index][1][0])
            ax.fill(formes[couleur_index][0], formes[couleur_index][1], color=couleurs[couleur_index], alpha=0.5)
            plt.draw()

            # Calculer et tracer la symétrie
            tracer_symetrie(ax, img_HU, formes[couleur_index][0], formes[couleur_index][1], couleurs[couleur_index])

            # Calculer la moyenne pour la forme actuelle (ROI) sur l'image en HU
            moyenne_forme = calculate_mean(img_HU, formes[couleur_index][0], formes[couleur_index][1])
            print(f"Valeur moyenne des pixels pour la forme {couleur_index + 1} (en HU): {moyenne_forme:.2f}")
            moyennes_rois.append(moyenne_forme)

            # Passer à la couleur suivante
            couleur_index += 1
            if couleur_index >= len(couleurs):
                # Si on a fini de dessiner les 7 formes, on arrête
                plt.gcf().canvas.mpl_disconnect(cid_press)
                plt.gcf().canvas.mpl_disconnect(cid_move)
                plt.gcf().canvas.mpl_disconnect(cid_release)

                # Afficher les valeurs moyennes des 7 ROI et de leurs symétries
                print("\nMoyennes des pixels dans les 7 ROI et leurs symétries :")
                for i in range(len(moyennes_rois)):
                    print(f"ROI {i + 1}: {moyennes_rois[i]:.2f}, Symétrie {i + 1}: {moyennes_symetries[i]:.2f}")

                # Enregistrer les moyennes dans un fichier texte
                enregistrer_moyennes_dans_fichier(moyennes_rois, moyennes_symetries)

    def tracer_symetrie(ax, image, points_x, points_y, color):
        # Calculer la symétrie selon l'axe vertical (milieu de l'image)
        largeur_image = image.shape[1]
        points_x_sym = [largeur_image - x for x in points_x]
        points_y_sym = points_y  # Les y restent les mêmes

        # Tracer la forme symétrique
        ax.plot(points_x_sym, points_y_sym, color=color)
        ax.fill(points_x_sym, points_y_sym, color=color, alpha=0.5)
        plt.draw()

        # Calculer la moyenne de la ROI symétrique
        moyenne_symetrie = calculate_mean(image, points_x_sym, points_y_sym)
        moyennes_symetries.append(moyenne_symetrie)
        print(f"Valeur moyenne des pixels pour la symétrie {len(moyennes_symetries)} (en HU): {moyenne_symetrie:.2f}")

    def calculate_mean(image, points_x, points_y):
        mask = np.zeros(image.shape, dtype=bool)
        rr, cc = np.mgrid[:image.shape[0], :image.shape[1]]
        polygon = plt.Polygon(list(zip(points_x, points_y)), closed=True)
        mask[polygon.contains_points(np.column_stack((cc.ravel(), rr.ravel()))).reshape(image.shape)] = True

        roi_pixels = image[mask]
        moyenne = roi_pixels.mean() if roi_pixels.size > 0 else 0
        return moyenne

    cid_press = plt.gcf().canvas.mpl_connect('button_press_event', start_drawing)
    cid_move = plt.gcf().canvas.mpl_connect('motion_notify_event', draw_line)
    cid_release = plt.gcf().canvas.mpl_connect('button_release_event', finish_drawing)
    plt.show()


################################################# Programme principal ##################################################
chemin_dossier = ouvrir_dossier()
if chemin_dossier:
    images_fenetrees = afficher_images_dicom(chemin_dossier)

    if images_fenetrees is not None:
        print("Nombre d'images fenêtrées :", len(images_fenetrees))

        # Accéder à une image spécifique
        index = 10  # Index de l'image que vous voulez afficher
        image_specifique = images_fenetrees[index]

        # Dessiner sept formes avec leurs symétries
        tracer_formes(image_specifique)