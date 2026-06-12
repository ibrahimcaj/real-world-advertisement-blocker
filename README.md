# real-world-advertisement-blocker

This project develops an AI-based system for detecting real-world advertisements in images and video streams and automatically filtering them by blurring the detected advertisement regions.

The current implementation uses YOLOv8 object detection to locate advertisements and applies a blur effect to the predicted bounding boxes. The long-term goal is to create a system that can reduce unwanted visual advertising in recorded media, live video, and future AR or smart-glasses environments.

---

## Problem Definition & Motivation

Advertisements are present in many public and digital visual environments: billboards, posters, banners, shop signs, digital panels, street advertisements, and branded surfaces. When people take photos, record videos, or use AR devices, these advertisements often become part of the captured scene without the user having control over them.

This creates several problems:

- **Lack of consumer control:** users cannot easily choose whether advertisements appear in their photos, videos, or visual field.
- **Cognitive overload:** dense public environments already contain a large amount of visual information, and advertisements add even more unnecessary content.
- **Visual pollution:** advertisements can dominate streets, buildings, and public spaces.
- **Branding issues:** unwanted logos and promotional content may appear in user-generated content.
- **AR and smart-glasses clutter:** future AR devices may make visual clutter even more noticeable if advertisements are not filtered.
- **Privacy and content moderation concerns:** recorded or streamed content may contain unwanted commercial or sensitive visual material.

The problem addressed by this project is therefore:

> How can we automatically detect real-world advertisements in images and video streams and visually filter them in real time?

---

## Proposed Solution

The proposed solution is a computer vision pipeline that detects advertisement regions and applies automatic visual filtering.

The basic workflow is:

```text
Input image or video frame
        ↓
YOLOv8 advertisement detection
        ↓
Bounding box prediction
        ↓
Blur detected advertisement regions
        ↓
Filtered output image or video
```

Instead of manually editing images or videos, the system automatically finds advertisement regions and blurs them. This makes the approach useful for both static images and video-based applications.

---

## Core Functionality

The current version of the project focuses on:

- detecting advertisements in real-world images
- detecting advertisements in video frames
- returning bounding boxes around detected ads
- blurring the detected advertisement regions
- testing the model on real, local, downloaded, and synthetic data

The current main task is **object detection**. A segmentation-based version was also explored, but it is not yet reliable enough to be used as the final solution.

---

## Applications

Possible applications of this project include:

- **Content moderation:** removing or hiding unwanted advertisements from images or videos.
- **Privacy protection:** reducing the visibility of branded or promotional content in recorded media.
- **AR / smart glasses:** filtering visual clutter from real-world environments.
- **Automatic visual filtering:** blurring advertisement regions without manual editing.
- **Selective ad filtering:** detecting only specific types of advertisements, such as betting, alcohol, banners, billboards, panels, or digital screens.
- **Sponsorship-aware filtering:** using the same idea in reverse, for example blurring everything except selected sponsor advertisements.

---

## Current Status

The project currently includes:

- a YOLOv8-based object detection pipeline
- a combined dataset from multiple sources
- locally collected advertisement images from Bosnia & Herzegovina
- synthetic data generated using Blender and Unreal Engine 5.6
- image and video inference experiments
- automatic blurring of detected advertisement bounding boxes
- an experimental segmentation approach that requires further improvement

Final quantitative results will be added after model training and evaluation are completed.

---

## Dataset & Data Preparation

To train and evaluate the advertisement detection model, we combined multiple data sources. This was done to make the dataset more diverse and to improve the model's ability to recognize advertisements in different environments, formats, lighting conditions, and camera perspectives.

The final dataset consists of approximately **2500 images**.

| Dataset source | Approximate size | Description |
|---|---:|---|
| Outdoor Advertising Dataset | 2200+ images | A foundational labeled advertisement dataset downloaded from Roboflow |
| Locally collected dataset | 111 images | Additional real-world advertisement images captured across Bosnia & Herzegovina |
| Synthetic dataset | 200 images | Procedurally generated advertisement scenes created using Blender and Unreal Engine 5.6 |
| Total | ~2500 images | Combined dataset used for training and evaluation |

### Outdoor Advertising Dataset

The primary dataset used in this project was an outdoor advertising dataset from Roboflow. This dataset provided more than 2200 labeled images and served as the foundation for training the initial advertisement detection model.

This dataset was useful because it already contained real-world outdoor advertisement examples, including billboards, posters, panels, and other advertisement formats. However, because the visual appearance of advertisements can vary significantly between countries, cities, and environments, we decided to expand the dataset with additional local and synthetic examples.

### Locally Collected Dataset

To make the model more relevant to our environment, we collected an additional dataset of **#111 real-world images#** from Bosnia & Herzegovina. These images were taken in local streets, roads, and urban environments where advertisements appear in forms such as billboards, shop signs, posters, banners, and panels.

This part of the dataset was important because advertisements in Bosnia & Herzegovina may differ from the downloaded dataset in terms of language, design style, placement, street layout, lighting, and background objects.

The locally collected images were manually labeled using **Label Studio**. We used Label Studio to draw bounding boxes around visible advertisement regions for the object detection task. After labeling, the annotations were exported and prepared in the YOLO format so they could be used for training the YOLOv8 detection model.

### Synthetic Dataset

In addition to real-world data, we created a synthetic dataset of approximately 200 images using Unreal Engine 5.6. The goal of this dataset was to increase visual diversity and simulate real-world advertisement scenarios that may not appear often enough in the collected data.

The synthetic data generation process allowed us to control and vary different scene parameters, such as:

- advertisement size
- advertisement position
- camera field of view
- camera distance and angle
- lighting conditions
- environmental layout
- weather conditions
- occlusion level
- day and night scenarios

This made it possible to create additional training examples in controlled but varied environments. Synthetic data was especially useful for testing the model on cases where advertisements appear under different conditions, such as unusual angles, partial occlusion, different scales, or different lighting.

This part of the project is documented separately in more detail:

```text
unreal_data_generator/README.md
```

That README explains the Unreal Engine setup, procedural generation process, configurable parameters, and how the generated images and annotations are produced.

### Data Cleaning

Before training, the dataset was reviewed and cleaned. The preparation process included:

- removing duplicate images
- removing irrelevant or unusable images
- checking whether advertisements were clearly visible
- checking annotation quality
- preparing the data in the correct YOLO format
- organizing the dataset into training, validation, and testing subsets

This step was necessary to reduce noise in the dataset and improve the quality of the model training process.

### Data Labeling

The labeling process focused on marking advertisement regions using bounding boxes. Each visible advertisement was labeled as an object that the YOLOv8 model should detect.

The locally collected dataset was manually labeled because these images did not already contain annotations. The downloaded dataset was also reviewed and adjusted where needed.

We also explored additional labeling for segmentation, where the goal was to mark the exact advertisement area instead of only a rectangular bounding box. However, the segmentation approach did not yet produce reliable enough results, so the current working version of the project focuses on object detection with bounding boxes.

### Dataset Purpose

Using three different data sources helped us cover a wider range of advertisement appearances:

- the downloaded dataset provided a large base of labeled outdoor advertisements
- the locally collected dataset added examples from Bosnia & Herzegovina
- the synthetic dataset added controlled variation through procedural generation

This combination was chosen to improve the model's ability to generalize to real-world images and videos.

---

## Model Architecture & Methodology

**DODATI**

---


## Object Detection Results

The object detection model was trained on the merged dataset containing the downloaded outdoor advertising dataset, locally collected images, and synthetic data. The current model uses YOLOv8 for detecting advertisement regions and returns bounding boxes that are later used for blurring.

The current object detection results are:

| Metric | Value |
|---|---:|
| Precision | 0.570 |
| Recall | 0.576 |
| F1 score | 0.573 |
| mAP50 | 0.594 |
| mAP50-95 | 0.435 |

These results show that the model is able to detect advertisement regions, while still leaving room for improvement. The precision and recall values are relatively balanced, which means the model does not strongly favor either over-detecting or missing advertisements. The mAP50 score is higher than the stricter mAP50-95 score, which is expected because mAP50-95 evaluates localization quality across multiple IoU thresholds.

During training, the model showed improvement across epochs. The mAP50 increased from approximately 0.447 in the first epoch to approximately 0.595 in the final epoch, while mAP50-95 increased from approximately 0.319 to approximately 0.436. Training and validation losses also generally decreased, indicating that the model was learning from the merged dataset.

![Object Detection Training Metrics](docs/graphs/object_detection_training_metrics.png)

![Object Detection Losses](docs/graphs/object_detection_losses.png)

---

## Repository Structure

Setup / Installation / How to Run,

**DODATI**

---

## Current Limitations

Although the current object detection pipeline provides a functional first version of advertisement filtering, there are still several limitations.

### Bounding Box Precision

The current system uses object detection, which means that advertisements are detected using rectangular bounding boxes. This works well for locating advertisements, but it is not always visually precise. If an advertisement has an irregular shape, the blur may also cover parts of the background around the ad.

A segmentation-based approach would be more precise because it could follow the exact borders of the advertisement. However, the current segmentation experiment does not yet produce reliable enough results for final use.

### Segmentation Performance

We experimented with segmentation because it would allow cleaner and more accurate advertisement filtering. However, the segmentation model currently performs poorly in several cases, especially when advertisements are small, partially occluded, placed at difficult angles, or surrounded by complex backgrounds.

Because of this, segmentation is currently treated as an experimental direction rather than the main working solution.

### Dataset Coverage

The combined dataset includes downloaded, locally collected, and synthetic images, but advertisements appear in many different formats and environments. The current dataset may still not cover all possible real-world cases, such as:

- very small advertisements
- heavily occluded advertisements
- digital screens
- unusual billboard shapes
- advertisements at night
- advertisements in bad weather
- reflections or motion blur
- text-heavy signs that are not advertisements

This means that the model may still fail or produce false detections in some real-world situations.

### False Positives

The model may sometimes confuse advertisements with visually similar objects, such as shop signs, posters, road signs, banners, logos, or text-heavy surfaces. This is a difficult problem because the boundary between an advertisement and a regular sign is not always visually obvious.

### Real-Time Performance

The project is designed with real-time or near-real-time filtering in mind, but the actual performance depends on the model size, input resolution, hardware, and video quality. Higher accuracy models may process frames more slowly, while smaller models may be faster but less accurate.

### Synthetic Data Gap

Synthetic data is useful for increasing variation and testing controlled scenarios, but it cannot fully replace real-world data. Generated environments may still differ from real images in texture quality, lighting realism, object placement, and background complexity.

For this reason, synthetic data is used as an addition to real-world data, not as a full replacement.

---

## Future Work

Several improvements are planned for future versions of the project.

### Improve Segmentation

One of the main future goals is to improve the segmentation model. A successful segmentation approach would allow the system to blur only the exact advertisement area instead of blurring the entire rectangular bounding box.

This would make the output cleaner and more visually accurate, especially for irregularly shaped advertisements, posters, banners, and signs.

### Expand the Dataset

The dataset can be improved by collecting and labeling more real-world advertisement images. Future data collection should focus on difficult cases, such as:

- night scenes
- rainy or snowy conditions
- low-light environments
- small advertisements
- partially hidden advertisements
- digital billboards
- advertisements from different cities and countries
- different camera angles and distances

Adding more diverse examples would help the model generalize better to real-world images and videos.

### Improve Synthetic Data Generation

The synthetic data generation pipeline can also be expanded. Future improvements could include more realistic environments, more advertisement formats, better lighting variation, more weather conditions, and more complex occlusion scenarios.

The synthetic generation system could also be used to create specific difficult examples that are rare in the real dataset.

### Optimize for Real-Time Video

Future work should include optimization for real-time video processing. This could involve:

- testing smaller YOLOv8 model variants
- reducing input resolution
- using GPU acceleration
- improving frame processing speed
- optimizing video reading and writing
- testing the model on live camera input

This would make the project more suitable for real-time applications such as AR devices, smart glasses, or live video filtering.

### Improve Evaluation

After the final training is completed, the model should be evaluated using standard object detection metrics such as precision, recall, mAP50, mAP50-95, and inference speed.

Future evaluation should also include visual comparisons on real images, synthetic images, and video examples. This would make it easier to understand not only the numerical performance of the model, but also its practical usefulness.

### Deployment Possibilities

In the future, the project could be developed into a more complete application or prototype. Possible deployment directions include:

- desktop image/video filtering tool
- live webcam filtering
- mobile application
- browser-based demo
- AR/smart-glasses prototype
- content moderation pipeline

These directions would require additional optimization, testing, and user interface development.
