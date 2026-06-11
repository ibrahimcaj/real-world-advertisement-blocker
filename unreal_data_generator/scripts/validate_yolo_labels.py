import cv2
from pathlib import Path


DATASET_ROOT = Path("C:/UE_Datasets/Ads")

IMAGES_DIR = DATASET_ROOT / "images"
DETECT_LABELS_DIR = DATASET_ROOT / "labels_det"
SEG_LABELS_DIR = DATASET_ROOT / "labels_seg"
DEBUG_DIR = DATASET_ROOT / "debug"

DEBUG_DIR.mkdir(parents=True, exist_ok=True)


def draw_detection_labels(image, label_path):
    height, width = image.shape[:2]

    if not label_path.exists():
        print(f"Missing detection label: {label_path}")
        return

    with open(label_path, "r", encoding="utf-8") as file:
        lines = file.readlines()

    for line in lines:
        parts = line.strip().split()

        if len(parts) != 5:
            continue

        class_id = parts[0]
        x_center = float(parts[1])
        y_center = float(parts[2])
        box_width = float(parts[3])
        box_height = float(parts[4])

        x1 = int((x_center - box_width / 2) * width)
        y1 = int((y_center - box_height / 2) * height)
        x2 = int((x_center + box_width / 2) * width)
        y2 = int((y_center + box_height / 2) * height)

        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(
            image,
            f"det {class_id}",
            (x1, max(y1 - 5, 15)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            1,
            cv2.LINE_AA,
        )


def draw_segmentation_labels(image, label_path):
    height, width = image.shape[:2]

    if not label_path.exists():
        print(f"Missing segmentation label: {label_path}")
        return

    with open(label_path, "r", encoding="utf-8") as file:
        lines = file.readlines()

    for line in lines:
        parts = line.strip().split()

        if len(parts) < 9:
            continue

        class_id = parts[0]
        coords = [float(value) for value in parts[1:]]

        points = []

        for i in range(0, len(coords), 2):
            x = int(coords[i] * width)
            y = int(coords[i + 1] * height)
            points.append((x, y))

        for i in range(len(points)):
            start_point = points[i]
            end_point = points[(i + 1) % len(points)]
            cv2.line(image, start_point, end_point, (0, 0, 255), 2)

        for point in points:
            cv2.circle(image, point, 4, (255, 0, 0), -1)

        if points:
            cv2.putText(
                image,
                f"seg {class_id}",
                points[0],
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 255),
                1,
                cv2.LINE_AA,
            )


def validate_first_frames(number_of_frames=10):
    for frame_index in range(number_of_frames):
        base_name = f"frame_{frame_index}"

        image_path = IMAGES_DIR / f"{base_name}.png"
        detect_label_path = DETECT_LABELS_DIR / f"{base_name}.txt"
        seg_label_path = SEG_LABELS_DIR / f"{base_name}.txt"
        debug_output_path = DEBUG_DIR / f"{base_name}_debug.png"

        image = cv2.imread(str(image_path))

        if image is None:
            print(f"Could not read image: {image_path}")
            continue

        draw_detection_labels(image, detect_label_path)
        draw_segmentation_labels(image, seg_label_path)

        cv2.imwrite(str(debug_output_path), image)
        print(f"Saved: {debug_output_path}")


if __name__ == "__main__":
    validate_first_frames(10)