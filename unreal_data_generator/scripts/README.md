# Validation Script

This folder contains the Python validation script used to visually check the generated YOLO labels from the Unreal synthetic data generator.

## File

* 'validate_yolo_labels.py'

## Purpose

The script reads generated Unreal images together with their YOLO detection and segmentation label files, then creates debug images with the labels drawn on top.

This helps verify that:

* detection boxes match the ads correctly
* segmentation polygons follow the ad corners correctly
* label files correspond to the correct image files
* hidden, occluded, or wrongly labeled ads can be spotted manually
* generated images are usable before adding them to the training dataset

## Expected Dataset Structure

By default, the script expects the dataset to be organized like this:


C:/UE_Datasets/Ads/
    images/
        frame_0.png
        frame_1.png
        ...
    labels_detect/
        frame_0.txt
        frame_1.txt
        ...
    labels_seg/
        frame_0.txt
        frame_1.txt
        ...
    debug/
        frame_0_debug.png
        frame_1_debug.png
        ...
'''

The image and label files must share the same base name.

Example:

images/frame_0.png
labels_detect/frame_0.txt
labels_seg/frame_0.txt
debug/frame_0_debug.png

## Label Formats

### YOLO Detection Format

Detection labels use the standard YOLO bounding box format:


class x_center y_center width height


All coordinate values are normalized between '0' and '1'.

Example:


0 0.309059 0.422695 0.051761 0.024552


### YOLO Segmentation Format

Segmentation labels use YOLO polygon format:


class x1 y1 x2 y2 x3 y3 x4 y4


For the synthetic ad dataset, each ad is represented as a rectangle using four corner points.

All coordinate values are normalized between '0' and '1'.

Example:


0 0.283178 0.410419 0.334939 0.410419 0.334939 0.434971 0.283178 0.434971


## Requirements

The script uses OpenCV.

Install it with:


pip install opencv-python


If 'pip' does not work, use:


python -m pip install opencv-python


## Usage

Run the script from the folder where 'validate_yolo_labels.py' is located:


python validate_yolo_labels.py


The script will read the generated images and labels, then save debug images inside the 'debug/' folder.

## Debug Image Colors

The generated debug images use the following visual markers:

* Green rectangles: YOLO detection bounding boxes
* Red outlines: YOLO segmentation polygons
* Blue dots: segmentation polygon corner points

## Notes

The validation images are not used for training. They are only used to manually inspect whether the exported labels match the generated images.

If a label appears on an ad that is hidden behind a building or another object, the Unreal camera points or occlusion filtering should be adjusted before generating a larger dataset.

If detection boxes or segmentation polygons appear shifted, the Unreal render target resolution, camera FOV, or label projection logic should be checked.
