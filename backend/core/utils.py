import face_recognition
import numpy as np


def get_face_embedding(image_path):
    """
    Extract face embedding from an image file.
    Returns a list of 128 numbers representing the face.
    Returns None if no face is detected.
    """
    try:
        image = face_recognition.load_image_file(image_path)

        # use 'cnn' model for better detection at angles
        # number_of_times_to_upsample=2 helps detect smaller/angled faces
        face_locations = face_recognition.face_locations(
            image,
            number_of_times_to_upsample=2,
            model="hog"  # use "cnn" for even better accuracy but slower
        )

        if len(face_locations) == 0:
            print(f"No face detected in {image_path}")
            return None

        # get embeddings using detected locations
        embeddings = face_recognition.face_encodings(
            image,
            known_face_locations=face_locations
        )

        if len(embeddings) == 0:
            return None

        return embeddings[0].tolist()

    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None


def compare_faces(embedding1, embedding2, threshold=0.5):
    """
    Compare two face embeddings.
    Returns (is_match, similarity_score)
    Lower distance = more similar faces
    """
    e1 = np.array(embedding1)
    e2 = np.array(embedding2)

    distance = float(np.linalg.norm(e1 - e2))
    similarity = round(max(0, (1 - distance) * 100), 2)
    is_match = distance < threshold

    return is_match, similarity


def find_matches(query_embedding, photos, threshold=0.5):
    """
    Search through all photos and find matching faces.
    Returns list of matches sorted by similarity (highest first).
    """
    matches = []

    for photo in photos:
        if not photo.embedding:
            continue

        stored_embedding = photo.get_embedding()
        is_match, similarity = compare_faces(
            query_embedding,
            stored_embedding,
            threshold
        )

        if is_match:
            matches.append({
                'photo': photo,
                'similarity': similarity
            })

    matches.sort(key=lambda x: x['similarity'], reverse=True)
    return matches