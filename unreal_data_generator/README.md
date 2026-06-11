# Unreal Synthetic Data Generator

## Brief Description
This module contains the Unreal Engine 5.6 synthetic data generation pipeline used to create procedurally varied ad images and YOLO labels for object detection and segmentation.

The generator creates rendered images from an Unreal scene and automatically exports matching object detection and segmentation label files.

## Table of Contents
- [Brief Description](#brief-description)
- [Project Context](#project-context)
- [Features](#features)
- [Folder Structure](#folder-structure)
- [Unreal Engine Setup](#unreal-engine-setup)
- [Blueprint System Overview](#blueprint-system-overview)
- [Output Dataset Structure](#output-dataset-structure)
- [Limitations](#limitations)
- [Licensing and Asset Notice](#licensing-and-asset-notice)
- [Future Improvements](#future-improvements)

## Project Context
The main project focuses on detecting ads in real and synthetic images/videos using YOLO. This Unreal generator is used only for creating the synthetic portion of the dataset.

The purpose of the synthetic data is to increase dataset variety by generating images under different camera positions, field of view values, lighting conditions, weather conditions, fog, rain, and day/night setups.

The generator also automatically creates YOLO labels for both object detection and segmentation, which reduces the amount of manual labeling needed when preparing training data.

## Features
- random camera point selection
- random FOV
- day/night batches
- weather/fog/rain variation
- SceneCapture2D image export
- YOLO detection labels
- YOLO segmentation polygon labels
- basic occlusion filtering with line traces
- Python validation overlays

## Folder Structure
The unreal_data_generator folder is organized into several smaller parts:

unreal_data_generator/
    README.md
    scripts/
    source_code/
    sample_output/
    unreal_project/

### [`scripts/`](scripts/)

Contains the Python validation script used to draw exported labels over the generated images. This is used to visually check whether the YOLO detection boxes and segmentation polygons match the rendered ads.

More details are available in [`scripts/README.md`](scripts/README.md).

### [`source_code/`](source_code/)

Contains the small C++ helper used in Unreal Engine to save generated label text files from Blueprints.

More details are available in [`source_code/README.md`](source_code/README.md).

### [`sample_output/`]

Contains a small sample of generated synthetic data. This is not the full synthetic dataset, but only a small example showing the output of the generator.

The sample output includes:

sample_output/
    images/
    labels_detect/
    labels_seg/
    debug/

### [`unreal_project/`]

Contains the Unreal side generator assets that can be reused or migrated into an Unreal Engine project.

The full city/map scene is not included in this repository because it uses third party assets that cannot be redistributed under their standard license.


## Unreal Engine Setup

The generator was built in Unreal Engine 5.6 and uses a Blueprint-based workflow with a small C++ helper for saving text files.

The setup is based around a scene containing ad surfaces, manually placed camera points, and custom Blueprint actors used for labeling and image generation.

The main Unreal-side requirements are:
- An Unreal Engine 5.6 project
- A scene or map containing visible ad surfaces
- BP_AdTarget actors placed around each ad that should be labeled
- BP_CameraPoint actors placed at possible camera positions
- A BP_RenderCamera actor with a SceneCaptureComponent2D
- A render target used for exporting generated images
- BP_DatasetGenerator placed in the level to control the generation loop
- BP_WeatherController for fog and weather variation
- The DatasetFileUtils C++ helper compiled into the project for saving .txt label files

The original scene used for this generator is not included in this public repository because it contains third party city assets. To reproduce the setup, the generator Blueprints can be reused in another Unreal project with a different map or placeholder environment.

The basic setup process is:

1. Add the generator Blueprints to an Unreal Engine 5.6 project.
2. Place ad target boxes around the ads that should be labeled.
3. Place camera points around the scene.
4. Assign class IDs to the ad targets.
5. Configure output folders, frame count, minimum label size, and occlusion settings.
6. Press Play to generate images and matching YOLO label files.

## Blueprint System Overview

## Output Dataset Structure 
The generator exports rendered images and matching YOLO label files. Each generated frame uses the same base filename across all output folders.

Example:

images/frame_0.png
labels_detect/frame_0.txt
labels_seg/frame_0.txt

The generated dataset is organized into separate folders:

output_dataset/
  images/
  labels_detect/
  labels_seg/

[`images/`]

Contains the rendered images exported from Unreal Engine.

Example:

images/frame_0.png
images/frame_1.png
images/frame_2.png

[`labels_detect/`]

Contains YOLO object detection label files. Each .txt file matches an image with the same base name.

Example:

images/frame_0.png
labels_detect/frame_0.txt

Detection labels use the YOLO bounding box format:

class x_center y_center width height

All coordinate values are normalized between 0 and 1.

Example:

0 0.309059 0.422695 0.051761 0.024552

[`labels_seg/`]

Contains YOLO segmentation label files. Each .txt file also matches an image with the same base name.

Example:

images/frame_0.png
labels_seg/frame_0.txt

Segmentation labels use YOLO polygon format:

class x1 y1 x2 y2 x3 y3 x4 y4

For this synthetic ad dataset, each ad is represented as a four-point rectangle. All coordinate values are normalized between 0 and 1.

Example:

0 0.283178 0.410419 0.334939 0.410419 0.334939 0.434971 0.283178 0.434971

[`debug/`]

Contains validation overlay images created by the Python validation script. These images are not used for training, but they help visually confirm that the exported labels match the generated images.

Example:

debug/frame_0_debug.png
debug/frame_1_debug.png
debug/frame_2_debug.png

The full generated synthetic dataset is stored separately in the main dataset folder of the project.

## Limitations

This is an early working version of the synthetic data generator, so there are still some limitations:

- Camera points are placed manually, so the quality of generated images depends on good camera placement.
- Day and night batches are currently handled manually by enabling the desired lighting setup before generation.
- Occlusion filtering uses a simple line-trace approach, so some edge cases may still require manual checking.
- Segmentation labels assume that each ad is a flat rectangular surface represented by four corner points.
- The validation overlays are used only for checking label quality and are not part of the training data.

## Licensing and Asset Notice

The original Unreal scene used during development included third party city/map assets from Fab. These assets are not included in this public repository.

According to the Fab Standard License summary, Fab assets may be used privately or commercially and may be shared with collaborators working on the project, but they may not be resold or redistributed as standalone assets. For this reason, the raw city/map assets are excluded from this repository.

This repository only includes the custom generator logic, helper code, validation script, selected Blueprint assets, documentation, and a small sample output.

To reproduce the original environment, users must either use their own licensed assets from Fab or replace the scene with their own Unreal map/assets.

Fab Standard License: https://www.fab.com/eula

## Future improvements

Possible future improvements for the Unreal synthetic data generator include:

- Add a fully redistributable demo scene using placeholder buildings and ad surfaces.
- Improve occlusion filtering by tracing to multiple ad points instead of only the ad center.
- Automate day/night switching instead of changing lighting setups manually.
- Add more weather and lighting presets for greater visual variety.
- Add automatic dataset splitting into train, val, and test folders.
- Add stronger quality checks to skip images with no visible ads or too many occluded labels.
- Improve camera point generation so useful camera views can be created more automatically.
- Add support for additional object classes beyond advertisements.

